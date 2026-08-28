import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { IdNameEntry, RelationshipFormData } from '../../../services/admin-api.service';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { CalendarComponent } from '../../../../../shared/local-lib/components/calendar/calendar.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ChipsComponent } from '../../../../../shared/local-lib/components/chips/chips.component';
import { CharacterImageField, CharacterWrapper, emptyCharacter, IMAGE_EXTENSIONS, replacePreview } from '../character-form.model';

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
    FileComponent,
    FieldContainerComponent,
    TooltipComponent,
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

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly namecardImages = NAMECARD_IMAGES;
  readonly characterImages = CHARACTER_IMAGES;

  foodOptions = computed<DropdownOption[]>(() => this.foods().map((food) => ({ key: food.id, value: food.name })));

  /** Newline-separated editing surfaces for the JSONB string-array columns. */
  howToObtainText = computed(() => (this.character().data.how_to_obtain ?? []).join('\n'));
  affiliationsText = computed(() => (this.character().data.affiliations ?? []).join('\n'));
  namecardSourcesText = computed(() => (this.character().data.namecard_sources ?? []).join('\n'));

  // ── Images ──────────────────────────────────────────────────────────────────

  /** Preview for a picked file, falling back to the path already stored on the character. */
  imageSrc(field: CharacterImageField): string | undefined {
    const character = this.character();
    return character.previews[field] ?? (character.data[field] as string | undefined) ?? undefined;
  }

  onImageSelect(field: CharacterImageField, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    this.character.update((character) => {
      const previews = { ...character.previews, [field]: replacePreview(character.previews[field], file) };
      const nextFiles = { ...character.files };
      if (file) {
        nextFiles[field] = file;
      } else {
        delete nextFiles[field];
      }
      return { ...character, files: nextFiles, previews };
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
