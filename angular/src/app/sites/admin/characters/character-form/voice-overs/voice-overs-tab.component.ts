import { Component, computed, input, model, QueryList, signal, ViewChildren } from '@angular/core';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { AccordionComponent } from '../../../../../shared/local-lib/components/accordion/accordion.component';
import { AccordionItemComponent } from '../../../../../shared/local-lib/components/accordion/item/item.component';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { takeUntil } from 'rxjs';
import { emptyVoiceOver, reorder, resequence, VoiceOverWrapper } from '../character-form.model';
import { VoiceOversTabItemComponent } from './tab/tab.component';
import { VoiceOverImportResult, VoiceOversImportComponent } from './import/voice-overs-import.component';

interface VoiceOverGroup {
  type: string;
  entries: { wrapper: VoiceOverWrapper; title: string }[];
}

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, AccordionComponent, AccordionItemComponent, TabsComponent, TabComponent, VoiceOversTabItemComponent],
})
export class VoiceOversTabComponent extends AbstractModalComponent {
  @ViewChildren(VoiceOversTabItemComponent) items?: QueryList<VoiceOversTabItemComponent>;

  voiceOvers = model<VoiceOverWrapper[]>([]);
  voiceOverTypes = input<string[]>([]);
  characterName = input<string>('');

  /** Shared across every item so only one clip plays at a time. */
  audio = model<HTMLAudioElement | null>(null);
  playingKey = model<string | null>(null);

  /** One accordion section per voice over type, ordered and labelled for display. */
  groups = computed<VoiceOverGroup[]>(() =>
    this.voiceOverTypes().map((type) => {
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
  openImport(): void {
    this.stopAudio();
    this.deleteAllArmed.set(false);

    const modal = this.modalService.open<VoiceOversImportComponent, VoiceOverImportResult | undefined>(VoiceOversImportComponent, {
      size: '5',
      scrollable: true,
    });
    modal.componentInstance.characterName.set(this.characterName());
    modal.componentInstance.voiceOverTypes.set(this.voiceOverTypes());
    modal.componentInstance.existingCount.set(this.voiceOvers().length);

    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((result) => {
      if (!result?.wrappers?.length) {
        return;
      }
      this.voiceOvers.update((voiceOvers) => (result.replaceExisting ? result.wrappers : [...voiceOvers, ...result.wrappers]));
      this.notificationService.showSuccess(`${result.wrappers.length} voice overs ${result.replaceExisting ? 'imported' : 'added'}.`);
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
    this.notificationService.showSuccess(`${count} voice overs removed. They are deleted when you save.`);
  }

  cancelDeleteAll(): void {
    this.deleteAllArmed.set(false);
  }
}
