import { Component, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokePicked, toLines, toStringArray } from '../../../shared/admin-full-resource.model';
import { toAssetBaseName } from '../../../shared/asset-name';
import { ARTIFACT_RARITIES, ArtifactWrapper, emptyArtifact } from '../artifact-form.model';

@Component({
  selector: 'app-artifact-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, CheckboxComponent, FieldContainerComponent, EntityImageComponent],
})
export class BaseInfoTabComponent {
  artifact = model<ArtifactWrapper>(emptyArtifact());

  readonly rarities = ARTIFACT_RARITIES;

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(): string | undefined {
    return this.artifact().data.icon || undefined;
  }

  /** Derived from the name input, so it follows a rename while the form is open. */
  iconName(): string {
    return toAssetBaseName(this.artifact().data.name);
  }

  onPicked(picked: PickedImage): void {
    this.artifact.update((artifact) => {
      revokePicked(artifact.pending);
      return { ...artifact, pending: picked };
    });
  }

  onCleared(): void {
    this.artifact.update((artifact) => {
      revokePicked(artifact.pending);
      return { ...artifact, pending: undefined };
    });
  }

  hasRarity(rarity: number): boolean {
    return !!this.artifact().data[`has_rarity_${rarity}`];
  }

  setRarity(rarity: number, value: boolean | undefined | null): void {
    this.artifact().data[`has_rarity_${rarity}`] = !!value;
  }

  effectsText(): string {
    return toStringArray(this.artifact().data.effects).join('\n');
  }

  onEffectsChange(value: string | number | undefined | null): void {
    this.artifact().data.effects = toLines(value);
  }

  obtainText(rarity: number): string {
    return toStringArray((this.artifact().data[`how_to_obtain_quality_${rarity}`] as string[] | undefined)).join('\n');
  }

  onObtainChange(rarity: number, value: string | number | undefined | null): void {
    this.artifact().data[`how_to_obtain_quality_${rarity}`] = toLines(value);
  }
}
