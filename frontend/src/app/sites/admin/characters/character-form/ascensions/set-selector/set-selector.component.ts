import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import { AscensionSet, AscensionSetApiService } from '../../../../../../api';

/**
 * Picks an ascension set for a character. A set is identified by the characters
 * that share it (the table itself is only an id), so each row lists them plus how
 * many ascension phases the set holds. Closes with the chosen set id, or undefined.
 * Mirrors the voice-over set selector.
 */
@Component({
  selector: 'app-ascension-set-selector',
  templateUrl: './set-selector.component.html',
  styleUrls: ['./set-selector.component.scss'],
  imports: [ButtonComponent, DialogFooterDirective, SpinnerComponent],
})
export class AscensionSetSelectorComponent extends AbstractModalComponent implements OnInit {
  /** The character's current set, marked in the list: what the opener hands over. */
  currentSetId = signal<number | null | undefined>(inject<number | null>(ANOTOKI_DIALOG_DATA, { optional: true }));

  sets = signal<AscensionSet[]>([]);
  loadingSets = signal(false);
  selectedId = signal<number | null>(null);

  private readonly _api = inject(AscensionSetApiService);

  ngOnInit(): void {
    this.loadingSets.set(true);
    this._api.getAscensionSets().subscribe({
      next: (data) => {
        this.sets.set(data ?? []);
        this.loadingSets.set(false);
      },
      error: () => {
        this.loadingSets.set(false);
        this.notificationService.error('Could not load the ascension sets.');
      },
    });
  }

  members(set: AscensionSet): string {
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
