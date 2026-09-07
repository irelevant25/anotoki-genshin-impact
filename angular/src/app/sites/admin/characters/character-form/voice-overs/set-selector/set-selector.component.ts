import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { VoiceOverSet, VoiceOverSetApiService } from '../../../../../../api';

/**
 * Picks a voice-over set for a character. A set is identified by the characters
 * that share it (the table itself is only an id), so each row lists them plus
 * how many lines the set holds. Closes with the chosen set id, or undefined.
 */
@Component({
  selector: 'app-voice-over-set-selector',
  templateUrl: './set-selector.component.html',
  styleUrls: ['./set-selector.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent],
})
export class VoiceOverSetSelectorComponent extends AbstractModalComponent implements OnInit {
  /** The character's current set, marked in the list. Set by the opener. */
  currentSetId = signal<number | null | undefined>(undefined);

  sets = signal<VoiceOverSet[]>([]);
  loadingSets = signal(false);
  selectedId = signal<number | null>(null);

  private readonly _api = inject(VoiceOverSetApiService);

  ngOnInit(): void {
    this.loadingSets.set(true);
    this._api.getVoiceOverSets().subscribe({
      next: (data) => {
        this.sets.set(data ?? []);
        this.loadingSets.set(false);
      },
      error: () => {
        this.loadingSets.set(false);
        this.notificationService.showError('Could not load the voice-over sets.');
      },
    });
  }

  members(set: VoiceOverSet): string {
    return set.characters.length ? set.characters.map((c) => c.name).join(', ') : '(no characters)';
  }

  choose(): void {
    if (this.selectedId() !== null) {
      this.modalRef?.close(this.selectedId());
    }
  }

  cancel(): void {
    this.modalRef?.close(undefined);
  }
}
