import { Component, Input, inject } from '@angular/core';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { BadgeComponent } from "../../../../../shared/local-lib/components/badge/badge.component";
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';

export interface ChangelogEntry {
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
  imports: [ModalComponent, BadgeComponent, TranslatePipe],
  providers: [AppDatePipe],
})
export class SiteVersionModalComponent extends AbstractModalComponent {
  @Input() data: ChangelogEntry[] = []; // CHANGELOG

  constructor(private _storageService: LocalStorageService) {
    super();
  }

  ngOnInit() {
    // Opening the changelog is what marks it read: the newest version shown is
    // recorded in this browser, so the new-version popup does not fire again.
    // Guarded because the modal can be opened programmatically the moment a new
    // version is noticed, before any entries are attached.
    if (!this.data?.length) {
      return;
    }
    const lastVersion = this._storageService.read(StorageKeys.VERSION);
    const currentVersion = this.data[0].version;
    if (lastVersion !== currentVersion) {
      this._storageService.write(StorageKeys.VERSION, currentVersion);
    }
  }

  private readonly _dates = inject(AppDatePipe);

  /** The reader's own date order, like every other date on the site. */
  formatDate(dateString: string): string {
    return this._dates.transform(dateString);
  }
}
