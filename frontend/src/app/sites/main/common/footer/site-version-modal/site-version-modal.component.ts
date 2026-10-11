import { Component, inject } from '@angular/core';
import { ANOTOKI_DIALOG_DATA } from '@anotoki/lib/ui/dialog';
import { BadgeComponent } from '@anotoki/lib/ui/badge';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { sameVersion } from '../versions';

export interface ChangelogEntry {
  /** MAJOR.MINOR.PATCH - big changes, new features, bug fixes. */
  version: string;
  date: string;
  changes: {
    added?: string[];
    fixed?: string[];
    updated?: string[];
  };
}

@Component({
  selector: 'app-site-version-modal',
  templateUrl: './site-version-modal.component.html',
  styleUrls: ['./site-version-modal.component.scss'],
  imports: [BadgeComponent, TranslatePipe],
  providers: [AppDatePipe],
})
export class SiteVersionModalComponent extends AbstractModalComponent {
  /** The changelog, newest first: the footer hands over what it has read. */
  readonly data: ChangelogEntry[] = inject<ChangelogEntry[] | null>(ANOTOKI_DIALOG_DATA, { optional: true }) ?? [];

  constructor(private _storageService: LocalStorageService) {
    super();
    const i18n = inject(TranslationService);
    this.dialogHeading(() => i18n.t('changelog.title'));
  }

  ngOnInit(): void {
    // Opening the changelog is what marks it read: the newest version shown is
    // recorded in this browser, so "What's new" does not open for it again.
    // Guarded because the footer's version button can be pressed before
    // changelog.json has arrived, when there are no entries to hand over. The
    // version kept may be the newest one's old name ("1.0" for "1.0.0"), which
    // is already this one.
    if (!this.data?.length) {
      return;
    }
    const lastVersion = this._storageService.read(StorageKeys.VERSION);
    const currentVersion = this.data[0].version;
    if (!sameVersion(lastVersion, currentVersion)) {
      this._storageService.write(StorageKeys.VERSION, currentVersion);
    }
  }

  private readonly _dates = inject(AppDatePipe);

  /** The reader's own date order, like every other date on the site. */
  formatDate(dateString: string): string {
    return this._dates.transform(dateString);
  }
}
