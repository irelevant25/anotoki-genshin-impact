import { Component, Input } from '@angular/core';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { BadgeComponent } from "../../../../../shared/local-lib/components/badge/badge.component";
import { StorageKeys } from '../../../../../shared/state-manager.service';

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
  imports: [ModalComponent, BadgeComponent],
  providers: [],
})
export class SiteVersionModalComponent extends AbstractModalComponent {
  @Input() data: ChangelogEntry[] = []; // CHANGELOG

  constructor(private _storageService: LocalStorageService) {
    super();
  }

  ngOnInit() {
    const lastVersion = this._storageService.read(StorageKeys.VERSION);
    const currentVersion = this.data[0].version;
    if (lastVersion !== currentVersion) {
      this._storageService.write(StorageKeys.VERSION, currentVersion);
    }
  }

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
}
