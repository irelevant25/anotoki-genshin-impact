import { Component, computed, inject, input, model, output, QueryList, signal, ViewChildren } from '@angular/core';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TabsComponent } from '@anotoki/lib/ui/tabs';
import { AccordionComponent, DisclosureComponent, DisclosurePanelDirective } from '@anotoki/lib/ui/disclosure';
import { createUid, emptyVoiceOver, reorder, resequence, VOICE_OVER_TYPES, VoiceOverWrapper } from '../character-form.model';
import { VoiceOversTabItemComponent } from './tab/tab.component';
import { VoiceOverImportData, VoiceOverImportResult, VoiceOversImportComponent } from './import/voice-overs-import.component';
import { VoiceOverSetSelectorComponent } from './set-selector/set-selector.component';
import { VoiceOverSetApiService } from '../../../../../api';

interface VoiceOverGroup {
  type: string;
  entries: { wrapper: VoiceOverWrapper; title: string }[];
}

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [TooltipDirective, ButtonComponent, NumberComponent, TextComponent, TabsComponent, AccordionComponent, DisclosureComponent, DisclosurePanelDirective, VoiceOversTabItemComponent],
})
export class VoiceOversTabComponent extends AbstractModalComponent {
  /** The four languages a line is voiced in, as the kit's tabs take them. */
  readonly languageTabs = [
    { id: 'english', label: 'English' },
    { id: 'japanese', label: 'Japanese' },
    { id: 'chinese', label: 'Chinese' },
    { id: 'korean', label: 'Korean' },
  ];

  @ViewChildren(VoiceOversTabItemComponent) items?: QueryList<VoiceOversTabItemComponent>;

  voiceOvers = model<VoiceOverWrapper[]>([]);
  readonly voiceOverTypes = VOICE_OVER_TYPES;
  characterName = input<string>('');
  /** The character's current voice-over set, marked in the picker. */
  voiceOverSetId = input<number | null | undefined>(undefined);
  /** Emitted with the chosen set id, so the form points the character at it. */
  voiceOverSetChosen = output<number>();

  private readonly _voiceOverSetApi = inject(VoiceOverSetApiService);

  /** Shared across every item so only one clip plays at a time. */
  audio = model<HTMLAudioElement | null>(null);
  playingKey = model<string | null>(null);

  /** One accordion section per voice over type, ordered and labelled for display. */
  groups = computed<VoiceOverGroup[]>(() =>
    this.voiceOverTypes.map((type) => {
      const entries = this.voiceOvers()
        .filter((voiceOver) => voiceOver.data.type === type)
        .sort((a, b) => a.data.order - b.data.order);

      const titleCounts = new Map<string, number>();
      for (const entry of entries) {
        const title = entry.data.title_english || 'Untitled';
        titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
      }

      return {
        type,
        entries: entries.map((wrapper) => ({ wrapper, title: this._displayTitle(wrapper, titleCounts) })),
      };
    })
  );

  private _displayTitle(wrapper: VoiceOverWrapper, titleCounts: Map<string, number>): string {
    const title = wrapper.data.title_english || 'Untitled';
    // Entries sharing a title are only tellable apart by their text, so append an excerpt.
    if ((titleCounts.get(title) ?? 0) > 1 && wrapper.data.text_english) {
      const excerpt = wrapper.data.text_english.substring(0, 40);
      return `${wrapper.data.order}. ${title} - ${excerpt}${wrapper.data.text_english.length > 40 ? '...' : ''}`;
    }
    return `${wrapper.data.order}. ${title}`;
  }

  addVoiceOver(type: string): void {
    const order = this.voiceOvers().filter((voiceOver) => voiceOver.data.type === type).length + 1;
    this.voiceOvers.update((voiceOvers) => [...voiceOvers, emptyVoiceOver(type, order)]);
  }

  removeVoiceOver(wrapper: VoiceOverWrapper): void {
    this.stopAudio();
    this.voiceOvers.update((voiceOvers) => {
      const remaining = voiceOvers.filter((voiceOver) => voiceOver !== wrapper);
      const sameType = remaining.filter((voiceOver) => voiceOver.data.type === wrapper.data.type);
      resequence(
        sameType,
        (voiceOver) => voiceOver.data.order,
        (voiceOver, order) => (voiceOver.data.order = order)
      );
      return remaining;
    });
  }

  onOrderChange(wrapper: VoiceOverWrapper, newOrder: number | string | null | undefined): void {
    this.voiceOvers.update((voiceOvers) => {
      const sameType = voiceOvers.filter((voiceOver) => voiceOver.data.type === wrapper.data.type);
      const changed = reorder(
        sameType,
        wrapper,
        newOrder,
        (voiceOver) => voiceOver.data.order,
        (voiceOver, order) => (voiceOver.data.order = order)
      );
      return changed ? [...voiceOvers] : voiceOvers;
    });
  }

  stopAudio(): void {
    this.items?.forEach((item) => item.stopAudio());
  }

  // ── Bulk actions ────────────────────────────────────────────────────────────

  /** Two-step delete, matching the confirm-in-place pattern used on the list page. */
  deleteAllArmed = signal(false);

  /**
   * Builds a whole set of voice overs from a JSON dump plus the character's
   * audio folder, matching each file to its line by title.
   */
  /**
   * Points this character at another voice-over set. Picks a set, loads its
   * lines into the tab so you can see what the character will show, and tells
   * the form to save the new set on the character. Editing the lines here after
   * this would edit that shared set (see the backend), so it is left as a
   * separate, deliberate step.
   */
  chooseSet(): void {
    this.stopAudio();
    this.deleteAllArmed.set(false);

    const modal = this.dialogs.open<VoiceOverSetSelectorComponent, number | undefined>(VoiceOverSetSelectorComponent, { heading: 'Choose a voice-over set', size: 'lg', data: this.voiceOverSetId() ?? null });

    void modal.closed.then((setId) => {
      if (typeof setId !== 'number') {
        return;
      }
      this._voiceOverSetApi.getVoiceOverSet(setId).subscribe({
        next: (voiceOvers) => {
          this.voiceOvers.set((voiceOvers ?? []).map((data) => ({ uid: createUid(), data, audio: {} })));
          this.voiceOverSetChosen.emit(setId);
          this.notificationService.success(`Now using set #${setId} (${voiceOvers?.length ?? 0} lines).`);
        },
        error: () => this.notificationService.error('Could not load that set’s voice-overs.'),
      });
    });
  }

  openImport(): void {
    this.stopAudio();
    this.deleteAllArmed.set(false);

    const modal = this.dialogs.open<VoiceOversImportComponent, VoiceOverImportResult | undefined, VoiceOverImportData>(VoiceOversImportComponent, {
      heading: 'Import Voice Overs',
      size: 'lg',
      data: { characterName: this.characterName(), existingCount: this.voiceOvers().length },
    });

    void modal.closed.then((result) => {
      if (!result?.wrappers?.length) {
        return;
      }
      this.voiceOvers.update((voiceOvers) => (result.replaceExisting ? result.wrappers : [...voiceOvers, ...result.wrappers]));
      this.notificationService.success(`${result.wrappers.length} voice overs ${result.replaceExisting ? 'imported' : 'added'}.`);
    });
  }

  /** For a recast, where every existing line is replaced wholesale. */
  deleteAll(): void {
    if (!this.deleteAllArmed()) {
      this.deleteAllArmed.set(true);
      return;
    }
    const count = this.voiceOvers().length;
    this.stopAudio();
    this.voiceOvers.set([]);
    this.deleteAllArmed.set(false);
    this.notificationService.success(`${count} voice overs removed. They are deleted when you save.`);
  }

  cancelDeleteAll(): void {
    this.deleteAllArmed.set(false);
  }
}
