import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '@anotoki/lib/translations';
import { CardComponent } from '@anotoki/lib/ui/card';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { Expanded, Food, FoodApiService, FoodPayload, Material, Saved } from '../../../../../../api';
import { asList, versionLabel, withMaterialFrom } from '../../shared/database-helpers';
import { GameListsService } from '../../../../game-lists.service';
import { DetailHeroComponent, HeroPicture, HeroStat } from '../../shared/detail-hero/detail-hero.component';
import { MaterialTileComponent } from '../../shared/material-tile/material-tile.component';
import { byName, Cook, cooksByDish } from '../food-dishes';

type FoodRow = Expanded<Food, 'created_by' | 'updated_by'>;

/** A line of the recipe: how many of which material - null for one the materials list lacks, which is left out. */
interface RecipeLine {
  quantity: number;
  material: Expanded<Material, 'created_by' | 'updated_by'> | null;
}

/** A dish made from this one - a character's special dish, a festival's - and whose it is. */
interface Variant {
  food: FoodRow;
  cook: Cook | null;
}

/**
 * The three dishes a recipe can turn out, from the worst to the best, each a
 * picture, an effect and a description of its own (`icon_*`, `effect_*`,
 * `description_*`). The column `effect` is not one of them: it is empty on
 * every food.
 */
const QUALITIES = [
  { key: 'suspicious', label: 'database.detail.quality.suspicious', icon: 'icon_suspicious', effect: 'effect_suspicious', description: 'description_suspicious' },
  { key: 'normal', label: 'database.detail.quality.normal', icon: 'icon_normal', effect: 'effect_normal', description: 'description_normal' },
  { key: 'delicious', label: 'database.detail.quality.delicious', icon: 'icon_delicious', effect: 'effect_delicious', description: 'description_delicious' },
] as const;

/**
 * The `/full` answer's food is the whole row (the API's find), though its type
 * is the body a form sends: `deleted` comes with it, unnamed.
 */
function isDeleted(row: object): boolean {
  return 'deleted' in row && row.deleted === true;
}

/**
 * A food's page: the hero in its rarity's colour with the normal dish's
 * picture and the strip of facts, the dish by quality, then the recipe, whose
 * special dish it is and what it is made from - or the dishes made from it -,
 * how to obtain it, its effects and its events: the same bones as the weapon's
 * page (the owner's choice of 2026-10-21 among the mockups, "Showcase"). A
 * deleted food is not found, as the list leaves it out.
 */
@Component({
  selector: 'app-database-food-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [LoaderComponent, TranslatePipe, CardComponent, MaterialIconDirective, DetailHeroComponent, MaterialTileComponent],
})
export class DatabaseFoodDetailComponent {
  private readonly _foodApi = inject(FoodApiService);
  private readonly _lists = inject(GameListsService);
  private readonly _route = inject(ActivatedRoute);

  food = signal<Saved<FoodPayload> | null>(null);
  recipe = signal<RecipeLine[]>([]);
  /** The character whose special dish this is. */
  cook = signal<Cook | null>(null);
  /** The dish this one is a variant of. */
  baseDish = signal<FoodRow | null>(null);
  variants = signal<Variant[]>([]);
  loading = signal(true);

  /** The qualities the food comes in - every one has the normal - each with what it has of its own. */
  qualities = computed(() => {
    const food = this.food();
    if (!food) {
      return [];
    }
    return QUALITIES.map((quality) => ({
      key: quality.key,
      label: quality.label,
      icon: food[quality.icon] || null,
      effect: food[quality.effect]?.trim() || null,
      description: food[quality.description]?.trim() || null,
    })).filter((quality) => quality.icon || quality.effect || quality.description);
  });

  effects = computed(() => asList(this.food()?.effects));
  howToObtain = computed(() => asList(this.food()?.how_to_obtain));
  events = computed(() => asList(this.food()?.events));

  /** The normal dish's own picture, its icon column - never a file named after the food. */
  splash = computed<HeroPicture | null>(() => {
    const icon = this.food()?.icon_normal;
    return icon ? { name: icon, folder: 'foods' } : null;
  });

  /** The strip of tiles under the name: what identifies the food at a glance. */
  heroStats = computed<HeroStat[]>(() => {
    const food = this.food();
    if (!food) {
      return [];
    }
    return [
      { label: 'database.detail.type', value: food.type, icon: food.type ? { name: food.type, folder: 'food_type' } : null },
      { label: 'database.filters.rarity', stars: Number(food.rarity) || null },
      { label: 'database.detail.proficiency', value: food.proficiency },
      { label: 'database.filters.region', value: food.region, icon: food.region ? { name: food.region, folder: 'regions', disc: true } : null },
      { label: 'database.filters.version', value: food.version ? versionLabel(food.version) : null },
    ];
  });

  constructor() {
    this._route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          if (!params.get('id')) {
            return of(null);
          }
          // The recipe names its materials by id, a special dish its character
          // only from the character's side, a variant its base dish by id: the
          // three lists come along, asked once a page life (GameListsService).
          // Each costs only its own card when it fails - never the food.
          return forkJoin({
            full: this._foodApi.getFoodFull(id),
            materials: this._lists.materials().pipe(catchError(() => of([]))),
            foods: this._lists.foods().pipe(catchError(() => of([]))),
            characters: this._lists.charactersMinimal().pipe(catchError(() => of([]))),
          }).pipe(map((loaded) => ({ id, ...loaded })));
        }),
      )
      .subscribe({
        next: (result) => {
          const food = result?.full.food ?? null;
          if (!result || !food || isDeleted(food)) {
            this._notFound();
            return;
          }
          const withMaterial = withMaterialFrom(result.materials);
          const cooks = cooksByDish(result.characters);
          const live = result.foods.filter((row) => !row.deleted);

          this.food.set(food);
          this.recipe.set((result.full.recipe ?? []).map((line) => withMaterial(line) as RecipeLine).filter((line) => !!line.material));
          this.cook.set(cooks.get(result.id) ?? null);
          this.baseDish.set(food.base_dish_id ? (live.find((row) => row.id === food.base_dish_id) ?? null) : null);
          this.variants.set(
            live
              .filter((row) => row.base_dish_id === result.id)
              .sort(byName)
              .map((row) => ({ food: row, cook: cooks.get(row.id) ?? null })),
          );
          this.loading.set(false);
        },
        error: () => this._notFound(),
      });
  }

  /** Nothing to show - no such food, a deleted one, or none to ask for - and nothing kept of the one before. */
  private _notFound(): void {
    this.food.set(null);
    this.recipe.set([]);
    this.cook.set(null);
    this.baseDish.set(null);
    this.variants.set([]);
    this.loading.set(false);
  }
}
