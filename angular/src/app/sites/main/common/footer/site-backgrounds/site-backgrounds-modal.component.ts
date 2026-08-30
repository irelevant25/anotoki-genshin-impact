import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../../../shared/state-manager.service';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface IBackground {
  name: string;
  preview: string;
  wallpaper: string;
}

@Component({
  selector: 'app-site-backgrounds-modal',
  templateUrl: './site-backgrounds-modal.component.html',
  styleUrls: ['./site-backgrounds-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, TranslatePipe],
  providers: [],
})
export class SiteBackgroundsModalComponent extends AbstractModalComponent {
  readonly BACKGROUNDS: IBackground[] = [
    {
      name: "Fontaine",
      preview: "assets/backgrounds/Fontaine - preview.avif",
      wallpaper: "assets/backgrounds/Fontaine.avif"
    },
    {
      name: "Liyue",
      preview: "assets/backgrounds/Liyue - preview.avif",
      wallpaper: "assets/backgrounds/Liyue.avif"
    },
    {
      name: "Arlecchino",
      preview: "assets/backgrounds/Arlecchino - preview.avif",
      wallpaper: "assets/backgrounds/Arlecchino.avif"
    },
    {
      name: "Arlecchino",
      preview: "assets/backgrounds/Arlecchino2 - preview.avif",
      wallpaper: "assets/backgrounds/Arlecchino2.avif"
    },
    {
      name: "Furina",
      preview: "assets/backgrounds/Furina - preview.avif",
      wallpaper: "assets/backgrounds/Furina.avif"
    },
    {
      name: "Kamisato Ayaka",
      preview: "assets/backgrounds/Kamisato Ayaka - preview.avif",
      wallpaper: "assets/backgrounds/Kamisato Ayaka.avif"
    },
    {
      name: "Kirara",
      preview: "assets/backgrounds/Kirara - preview.avif",
      wallpaper: "assets/backgrounds/Kirara.avif"
    },
    {
      name: "Raiden Shogun",
      preview: "assets/backgrounds/Raiden Shogun - preview.avif",
      wallpaper: "assets/backgrounds/Raiden Shogun.avif"
    },
    {
      name: "Sayu",
      preview: "assets/backgrounds/Sayu - preview.avif",
      wallpaper: "assets/backgrounds/Sayu.avif"
    },
    {
      name: "Xiangling",
      preview: "assets/backgrounds/Xiangling - preview.avif",
      wallpaper: "assets/backgrounds/Xiangling.avif"
    },
    {
      name: "Yae Miko",
      preview: "assets/backgrounds/Yae Miko - preview.avif",
      wallpaper: "assets/backgrounds/Yae Miko.avif"
    },
    {
      name: "Zhongli",
      preview: "assets/backgrounds/Zhongli - preview.avif",
      wallpaper: "assets/backgrounds/Zhongli.avif"
    }
  ];

  constructor(private _storageService: LocalStorageService) {
    super();
  }

  changeBackground(background: IBackground): void {
    const imgUrl = background.wallpaper;
    const encodedPath = encodeURI(imgUrl);
    document.body.style.backgroundImage = `url(${encodedPath})`;
    this._storageService.write(StorageKeys.BACKGROUND, imgUrl);
  }
}
