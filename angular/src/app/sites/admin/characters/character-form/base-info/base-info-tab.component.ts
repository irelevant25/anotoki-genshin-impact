import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { IdNameEntry } from '../../../../../api';
import { RelationshipFormData } from '../../../shared/admin-form.model';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { CalendarComponent } from '../../../../../shared/local-lib/components/calendar/calendar.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { ChipsComponent } from '../../../../../shared/local-lib/components/chips/chips.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { characterImageName, CharacterImageField, CharacterWrapper, emptyCharacter, revokePicked } from '../character-form.model';
import { toStringArray } from '../../../../../sites/admin/shared/admin-full-resource.model';

interface ImageFieldConfig {
  field: CharacterImageField;
  label: string;
  required: boolean;
}

const NAMECARD_IMAGES: ImageFieldConfig[] = [
  { field: 'namecard_icon', label: 'Namecard Icon', required: true },
  { field: 'namecard_background', label: 'Namecard Background', required: true },
  { field: 'namecard_banner', label: 'Namecard Banner', required: true },
];

const CHARACTER_IMAGES: ImageFieldConfig[] = [
  { field: 'icon', label: 'Icon', required: true },
  { field: 'card_icon', label: 'Card Icon', required: true },
  { field: 'card_icon_2', label: 'Card Icon 2', required: false },
  { field: 'wish_icon', label: 'Wish Icon', required: true },
];

/** Splits a textarea into the trimmed, non-empty lines a JSONB string array holds. */
function toLines(value: string | number | undefined | null): string[] {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function emptyRelationship(): RelationshipFormData {
  return { type: '', name: '', state: '', is_biological: false };
}

@Component({
  selector: 'app-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [
    ButtonComponent,
    TextComponent,
    DropdownComponent,
    CalendarComponent,
    CheckboxComponent,
    TextareaComponent,
    FieldContainerComponent,
    EntityImageComponent,
    ChipsComponent,
  ],
})
export class BaseInfoTabComponent {
  character = model<CharacterWrapper>(emptyCharacter());
  relationships = model<RelationshipFormData[]>([]);
  selectedRoles = model<string[]>([]);

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

  foodOptions = computed<DropdownOption[]>(() => this.foods().map((food) => ({ key: food.id, value: food.name })));

  /** Newline-separated editing surfaces for the JSONB string-array columns. */
  howToObtainText = computed(() => toStringArray(this.character().data.how_to_obtain).join('\n'));
  affiliationsText = computed(() => toStringArray(this.character().data.affiliations).join('\n'));
  namecardSourcesText = computed(() => toStringArray(this.character().data.namecard_sources).join('\n'));

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
