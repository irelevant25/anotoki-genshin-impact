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
  /**
   * The Database's six parts, each a card linking to its list - with no help of its own (the owner, 2026-10-20).
   * The four there first keep their order, which readers know, and the two added on 2026-10-29 follow Banners on
   * the second row (the owner's word). Each card's picture is a character's wish art: Escoffier, a chef, for the Food.
   */
  readonly DATABASE = [
    {
      path: ROUTE_MAP.map['database'].characters.path,
      title: 'database.characters.title',
      cardImage: 'assets/character/wish_icon/FURINA.avif',
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
    {
      path: ROUTE_MAP.map['database'].artifacts.path,
      title: 'database.artifacts.title',
      cardImage: 'assets/character/wish_icon/NAHIDA.avif',
      cardInfo: 'database.artifacts.info',
    },
    {
      path: ROUTE_MAP.map['database'].foods.path,
      title: 'database.foods.title',
      cardImage: 'assets/character/wish_icon/ESCOFFIER.avif',
      cardInfo: 'database.foods.info',
    },
  ];
}
