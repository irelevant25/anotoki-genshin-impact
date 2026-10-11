import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
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
  imports: [ButtonComponent, DialogFooterDirective, SpinnerComponent],
})
export class VoiceOverSetSelectorComponent extends AbstractModalComponent implements OnInit {
  /** The character's current set, marked in the list: what the opener hands over. */
  currentSetId = signal<number | null | undefined>(inject<number | null>(ANOTOKI_DIALOG_DATA, { optional: true }));

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
        this.notificationService.error('Could not load the voice-over sets.');
      },
    });
  }

  members(set: VoiceOverSet): string {
    return set.characters.length ? set.characters.map((c) => c.name).join(', ') : '(no characters)';
  }

  choose(): void {
    if (this.selectedId() !== null) {
      this.dialogRef?.close(this.selectedId());
    }
  }

  cancel(): void {
    this.dialogRef?.close(undefined);
  }
}
