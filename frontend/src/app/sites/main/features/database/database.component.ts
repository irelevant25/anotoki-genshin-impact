import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ROUTE_MAP } from '../../../../shared/routing-definition';
import { TranslatePipe } from '@anotoki/lib/translations';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
  imports: [RouterModule, TranslatePipe],
  providers: [],
})
export class DatabaseComponent {
  /** The Database's four parts, each a card linking to its list - with no help of its own (the owner, 2026-10-20). */
  readonly DATABASE = [
    {
      path: ROUTE_MAP.map['database'].characters.path,
      title: 'database.characters.title',
      cardImage: 'assets/character/wish_icon/NAHIDA.avif',
      cardInfo: 'database.characters.info',
    },
    {
      path: ROUTE_MAP.map['database'].materials.path,
      title: 'database.materials.title',
      cardImage: 'assets/character/wish_icon/ZHONGLI.avif',
      cardInfo: 'database.materials.info',
    },
    {
      path: ROUTE_MAP.map['database'].weapons.path,
      title: 'database.weapons.title',
      cardImage: 'assets/character/wish_icon/NOELLE.avif',
      cardInfo: 'database.weapons.info',
    },
    {
      path: ROUTE_MAP.map['database'].banners.path,
      title: 'database.banners.title',
      cardImage: 'assets/character/wish_icon/QIQI.avif',
      cardInfo: 'database.banners.info',
    },
  ];
}
