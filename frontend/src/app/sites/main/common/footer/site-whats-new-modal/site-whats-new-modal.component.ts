import { Component, computed, effect, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { ChangelogEntry, SiteVersionModalComponent } from '../site-version-modal/site-version-modal.component';
import { sameVersion } from '../versions';

type ChangeKind = keyof ChangelogEntry['changes'];

/** What the footer hands over when it opens this. */
export interface WhatsNewData {
  /** The newest version - the one this is about. */
  latest: ChangelogEntry;
  /** Whether this browser also missed versions before the newest one. */
  hasEarlier: boolean;
  /** Every version, for "See all changes". */
  changelog: ChangelogEntry[];
}

/** One line of the list: a change, and what kind of change it was. */
interface ChangeLine {
  text: string;
  kind: ChangeKind;
  icon: string;
  /** The kind as a word, for a screen reader and a hover - see KINDS. */
  label: string;
}

/**
 * The kinds in the order they are listed: what is new first, then what got
 * better, then what was mended. The words are the changelog's own section
 * headings, so the two dialogs call each kind the same thing.
 */
const KINDS: { kind: ChangeKind; icon: string; label: string }[] = [
  { kind: 'added', icon: 'icon-plus', label: 'changelog.added' },
  { kind: 'updated', icon: 'icon-refresh', label: 'changelog.updated' },
  { kind: 'fixed', icon: 'icon-check', label: 'changelog.fixed' },
];

/**
 * What a visitor sees once after a release: the newest version's changes, on
 * one short page.
 *
 * The changelog is the record - every version a card, every change filed under
 * its heading - and it stays one press away, behind "See all changes". This is
 * the note on the door instead: one version, one list, and nothing flagged as
 * new, because all of it is.
 */
@Component({
  selector: 'app-site-whats-new-modal',
  templateUrl: './site-whats-new-modal.component.html',
  styleUrls: ['./site-whats-new-modal.component.scss'],
  imports: [ButtonComponent, DialogFooterDirective, TranslatePipe, AppDatePipe],
})
export class SiteWhatsNewModalComponent extends AbstractModalComponent {
  private readonly _storage = inject(LocalStorageService);

  private readonly _data = inject<WhatsNewData | null>(ANOTOKI_DIALOG_DATA, { optional: true });

  /** The newest version - the one this is about. */
  readonly latest = signal<ChangelogEntry | null>(this._data?.latest ?? null);

  /** Whether this browser also missed versions before the newest one. */
  readonly hasEarlier = signal<boolean>(this._data?.hasEarlier ?? false);

  /** Every version, for "See all changes". */
  readonly changelog = signal<ChangelogEntry[]>(this._data?.changelog ?? []);

  readonly lines = computed<ChangeLine[]>(() => {
    const changes = this.latest()?.changes;
    if (!changes) {
      return [];
    }
    return KINDS.flatMap(({ kind, icon, label }) => (changes[kind] ?? []).map((text) => ({ text, kind, icon, label })));
  });

  constructor() {
    super();
    const i18n = inject(TranslationService);
    this.dialogHeading(() => i18n.t('whatsNew.title'));

    // Being shown is what marks the version seen, as opening the changelog
    // does, so this greets each version once per browser. An effect, so it
    // follows whatever entry the opener hands over, whenever it does.
    effect(() => {
      const version = this.latest()?.version;
      if (version && !sameVersion(this._storage.read(StorageKeys.VERSION), version)) {
        this._storage.write(StorageKeys.VERSION, version);
      }
    });
  }

  /**
   * Swaps this for the full changelog - every version, not only the ones this
   * browser had not seen. Opened before this one closes: closing destroys this
   * component, and a destroyed component should not be the one still at work.
   */
  seeAllChanges(): void {
    this.openModal(SiteVersionModalComponent, { size: 'md', data: this.changelog() });
    this.closeModal();
  }
}
