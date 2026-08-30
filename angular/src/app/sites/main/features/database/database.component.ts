import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ROUTE_MAP } from '../../../../shared/routing-definition';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
  imports: [RouterModule, TranslatePipe],
  providers: []
})
export class DatabaseComponent {
  readonly DATABASE = [
    {
      path: ROUTE_MAP.map['database'].characters.path,
      title: 'database.characters.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'database.characters.about',
      cardImage: 'assets/character/wish_icon/Nahida.avif',
      cardInfo: 'database.characters.info',
    },
    {
      path: ROUTE_MAP.map['database'].materials.path,
      title: 'database.materials.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'database.materials.about',
      cardImage: 'assets/character/wish_icon/Zhongli.avif',
      cardInfo: 'database.materials.info',
    },
    {
      path: ROUTE_MAP.map['database'].weapons.path,
      title: 'database.weapons.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'database.weapons.about',
      cardImage: 'assets/character/wish_icon/Noelle.avif',
      cardInfo: 'database.weapons.info',
    },
    {
      path: ROUTE_MAP.map['database'].banners.path,
      title: 'database.banners.title',
      badgeIcon: false,
      helpIcon: true,
      modalTitle: 'database.banners.about',
      cardImage: 'assets/character/wish_icon/Qiqi.avif',
      cardInfo: 'database.banners.info',
    },
  ];
}
