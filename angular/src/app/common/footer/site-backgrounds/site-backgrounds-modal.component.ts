import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/local-lib/components/modal/modal.component';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { LocalStorageService } from '../../../shared/local-lib/services/local-storage.service';
import { StorageKeys } from '../../../shared/state-manager.service';

interface IBackground {
  name: string;
  preview: string;
  wallpaper: string;
}

@Component({
  selector: 'app-site-backgrounds-modal',
  templateUrl: './site-backgrounds-modal.component.html',
  styleUrls: ['./site-backgrounds-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule],
  providers: [],
})
export class SiteBackgroundsModalComponent extends AbstractModalComponent {
  readonly BACKGROUNDS: IBackground[] = [
    {
      name: "Fontaine",
      preview: "assets/wallpaper/Fontaine - preview.avif",
      wallpaper: "assets/wallpaper/Fontaine.avif"
    },
    {
      name: "Liyue",
      preview: "assets/wallpaper/Liyue - preview.avif",
      wallpaper: "assets/wallpaper/Liyue.avif"
    },
    {
      name: "Arlecchino",
      preview: "assets/wallpaper/Arlecchino - preview.avif",
      wallpaper: "assets/wallpaper/Arlecchino.avif"
    },
    {
      name: "Arlecchino",
      preview: "assets/wallpaper/Arlecchino2 - preview.avif",
      wallpaper: "assets/wallpaper/Arlecchino2.avif"
    },
    {
      name: "Furina",
      preview: "assets/wallpaper/Furina - preview.avif",
      wallpaper: "assets/wallpaper/Furina.avif"
    },
    {
      name: "Kamisato Ayaka",
      preview: "assets/wallpaper/Kamisato Ayaka - preview.avif",
      wallpaper: "assets/wallpaper/Kamisato Ayaka.avif"
    },
    {
      name: "Kirara",
      preview: "assets/wallpaper/Kirara - preview.avif",
      wallpaper: "assets/wallpaper/Kirara.avif"
    },
    {
      name: "Raiden Shogun",
      preview: "assets/wallpaper/Raiden Shogun - preview.avif",
      wallpaper: "assets/wallpaper/Raiden Shogun.avif"
    },
    {
      name: "Sayu",
      preview: "assets/wallpaper/Sayu - preview.avif",
      wallpaper: "assets/wallpaper/Sayu.avif"
    },
    {
      name: "Xiangling",
      preview: "assets/wallpaper/Xiangling - preview.avif",
      wallpaper: "assets/wallpaper/Xiangling.avif"
    },
    {
      name: "Yae Miko",
      preview: "assets/wallpaper/Yae Miko - preview.avif",
      wallpaper: "assets/wallpaper/Yae Miko.avif"
    },
    {
      name: "Zhongli",
      preview: "assets/wallpaper/Zhongli - preview.avif",
      wallpaper: "assets/wallpaper/Zhongli.avif"
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
