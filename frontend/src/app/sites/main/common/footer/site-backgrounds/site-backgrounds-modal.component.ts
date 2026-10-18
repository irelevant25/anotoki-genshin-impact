import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { Wallpaper, WALLPAPERS } from './wallpapers';

/** The wallpapers' window, opened from the account panel: a wallpaper chosen is shown at once, and kept in this browser. */
@Component({
  selector: 'app-site-backgrounds-modal',
  templateUrl: './site-backgrounds-modal.component.html',
  styleUrls: ['./site-backgrounds-modal.component.scss'],
  imports: [ReactiveFormsModule, TranslatePipe],
  providers: [],
})
export class SiteBackgroundsModalComponent extends AbstractModalComponent {
  readonly BACKGROUNDS = WALLPAPERS;

  constructor(private _storageService: LocalStorageService) {
    super();
    const i18n = inject(TranslationService);
    this.dialogHeading(() => i18n.t('backgrounds.title'));
  }

  changeBackground(background: Wallpaper): void {
    const imgUrl = background.wallpaper;
    const encodedPath = encodeURI(imgUrl);
    document.body.style.backgroundImage = `url(${encodedPath})`;
    this._storageService.write(StorageKeys.BACKGROUND, imgUrl);
  }
}
