import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TalentSet, TalentSetApiService } from '../../../../../../api';

/**
 * Picks a talent set for a character. A set is identified by the characters that
 * share it (the table itself is only an id), so each row lists them plus how many
 * talents the set holds. Closes with the chosen set id, or undefined. Mirrors the
 * ascension set selector.
 */
@Component({
  selector: 'app-talent-set-selector',
  templateUrl: './set-selector.component.html',
  styleUrls: ['./set-selector.component.scss'],
  imports: [ModalComponent, ButtonComponent, LoaderComponent],
})
export class TalentSetSelectorComponent extends AbstractModalComponent implements OnInit {
  /** The character's current set, marked in the list. Set by the opener. */
  currentSetId = signal<number | null | undefined>(undefined);

  sets = signal<TalentSet[]>([]);
  loadingSets = signal(false);
  selectedId = signal<number | null>(null);

  private readonly _api = inject(TalentSetApiService);

  ngOnInit(): void {
    this.loadingSets.set(true);
    this._api.getTalentSets().subscribe({
      next: (data) => {
        this.sets.set(data ?? []);
        this.loadingSets.set(false);
      },
      error: () => {
        this.loadingSets.set(false);
        this.notificationService.showError('Could not load the talent sets.');
      },
    });
  }

  members(set: TalentSet): string {
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
