import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ConstellationSetApiService } from '../../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { ConstellationWrapper, createUid, emptyConstellation, reorder, revokePicked, resequence } from '../character-form.model';
import { ConstellationSetSelectorComponent } from './set-selector/set-selector.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { toAssetBaseName } from '../../../shared/asset-name';

const MAX_CONSTELLATIONS = 6;

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [TooltipDirective, ButtonComponent, TextComponent, TextareaComponent, NumberComponent, EntityImageComponent, FieldContainerComponent],
})
export class ConstellationsTabComponent extends AbstractModalComponent {
  constellations = model<ConstellationWrapper[]>([]);
  /** The character's current constellation set, marked in the picker. */
  constellationSetId = input<number | null | undefined>();
  /** Emitted with the chosen set id, so the form points the character at it. */
  constellationSetChosen = output<number>();

  private readonly _constellationSetApi = inject(ConstellationSetApiService);

  readonly maxConstellations = MAX_CONSTELLATIONS;

  /**
   * Points this character at another constellation set. Picks a set, loads its
   * constellations into the tab, and tells the form to save the new set on the
   * character. Mirrors the ascension "Choose set".
   */
  chooseSet(): void {
    const modal = this.dialogs.open<ConstellationSetSelectorComponent, number | undefined>(ConstellationSetSelectorComponent, {
      heading: 'Choose a constellation set',
      size: 'lg',
      data: this.constellationSetId() ?? null,
    });

    void modal.closed.then((setId) => {
      if (typeof setId !== 'number') {
        return;
      }
      this._constellationSetApi.getConstellationSet(setId).subscribe({
        next: (rows) => {
          this.constellations.set((rows ?? []).map((data) => ({ uid: createUid(), data: data as unknown as ConstellationWrapper['data'] })));
          this.constellationSetChosen.emit(setId);
          this.notificationService.success(`Now using set #${setId} (${rows?.length ?? 0} constellations).`);
        },
        error: () => this.notificationService.error('Could not load that set’s constellations.'),
      });
    });
  }

  sorted = computed(() => [...this.constellations()].sort((a, b) => a.data.level - b.data.level));
  canAdd = computed(() => this.constellations().length < MAX_CONSTELLATIONS);

  /** Two-step clear of the whole set, matching the voice-over tab. */
  deleteAllArmed = signal(false);

  deleteAll(): void {
    if (!this.deleteAllArmed()) {
      this.deleteAllArmed.set(true);
      return;
    }
    const count = this.constellations().length;
    this.constellations.set([]);
    this.deleteAllArmed.set(false);
    this.notificationService.success(`${count} constellations removed. They are deleted when you save.`);
  }

  cancelDeleteAll(): void {
    this.deleteAllArmed.set(false);
  }

  addConstellation(): void {
    this.constellations.update((constellations) => [...constellations, emptyConstellation(constellations.length + 1)]);
  }

  removeConstellation(wrapper: ConstellationWrapper): void {
    revokePicked(wrapper.pending);
    this.constellations.update((constellations) => {
      const remaining = constellations.filter((constellation) => constellation !== wrapper);
      resequence(
        remaining,
        (constellation) => constellation.data.level,
        (constellation, level) => (constellation.data.level = level),
      );
      return remaining;
    });
  }

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(wrapper: ConstellationWrapper): string | undefined {
    return wrapper.data.icon || undefined;
  }

  /** Constellation art is named after the constellation itself. */
  iconName(wrapper: ConstellationWrapper): string {
    return toAssetBaseName(wrapper.data.name);
  }

  onPicked(wrapper: ConstellationWrapper, picked: PickedImage): void {
    revokePicked(wrapper.pending);
    wrapper.pending = picked;
  }

  onCleared(wrapper: ConstellationWrapper): void {
    revokePicked(wrapper.pending);
    wrapper.pending = undefined;
  }

  onLevelChange(wrapper: ConstellationWrapper, newLevel: number | string | null | undefined): void {
    this.constellations.update((constellations) => {
      const changed = reorder(
        constellations,
        wrapper,
        newLevel,
        (constellation) => constellation.data.level,
        (constellation, level) => (constellation.data.level = level),
      );
      return changed ? [...constellations] : constellations;
    });
  }
}
