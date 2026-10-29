import { Injectable, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { isAdminArea } from '@anotoki/lib/translations';
import { Observable, catchError, filter, shareReplay, throwError } from 'rxjs';
import { ArtifactApiService, BannerApiService, CharacterApiService, FoodApiService, MaterialApiService, WeaponApiService } from '../../api';

/**
 * The game's lists as the public site reads them: each asked once while the
 * page is open and shared by every page that needs it (the owner's decision of
 * 2026-10-21). The character page asks for the materials and the Materials
 * page then has them; the first quiz asks for the characters and every other
 * quiz, the tournament and the daily's have them. A reload asks afresh.
 *
 * The public site's alone. The admin panel asks the generated services every
 * time, as its staff edit what they show - never inject this there - and
 * opening it forgets every list here, so a page of the public site opened
 * after an edit in the same tab asks again.
 *
 * A failure is not kept: the next page that wants the list asks again. The
 * lists are shared, so nothing may change one in place: sort a copy.
 */
@Injectable({ providedIn: 'root' })
export class GameListsService {
  private readonly _characterApi = inject(CharacterApiService);
  private readonly _materialApi = inject(MaterialApiService);
  private readonly _weaponApi = inject(WeaponApiService);
  private readonly _bannerApi = inject(BannerApiService);
  private readonly _foodApi = inject(FoodApiService);
  private readonly _artifactApi = inject(ArtifactApiService);

  private readonly _asked = new Map<string, Observable<unknown>>();

  constructor() {
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationStart && isAdminArea(event.url)))
      .subscribe(() => this._asked.clear());
  }

  /** Every character with every column (`GET /api/characters`): the Characters and Banners pages. */
  characters(): ReturnType<CharacterApiService['getCharacters']> {
    return this._once('characters', () => this._characterApi.getCharacters());
  }

  /** Every character without the editors' columns (`GET /api/characters/minimal`): the quizzes, the tournament, and the cooks on the Food pages. */
  charactersMinimal(): ReturnType<CharacterApiService['getCharactersMinimal']> {
    return this._once('charactersMinimal', () => this._characterApi.getCharactersMinimal());
  }

  /** Every material (`GET /api/materials`): the Materials page, and the costs on a character's or a weapon's page and a food's recipe. */
  materials(): ReturnType<MaterialApiService['getMaterials']> {
    return this._once('materials', () => this._materialApi.getMaterials());
  }

  /** Every weapon (`GET /api/weapons`): the Weapons and Banners pages. */
  weapons(): ReturnType<WeaponApiService['getWeapons']> {
    return this._once('weapons', () => this._weaponApi.getWeapons());
  }

  /** Every banner with the characters and weapons it names (`GET /api/banners/full`): the Banners page. */
  banners(): ReturnType<BannerApiService['getBannersFull']> {
    return this._once('banners', () => this._bannerApi.getBannersFull());
  }

  /** Every food (`GET /api/foods`): the Food list, a dish's base dish and variants on its page, and the dish quiz. */
  foods(): ReturnType<FoodApiService['getFoods']> {
    return this._once('foods', () => this._foodApi.getFoods());
  }

  /** Every artifact set (`GET /api/artifacts`, the deleted ones too - a page leaves them out): the Artifacts page. */
  artifacts(): ReturnType<ArtifactApiService['getArtifacts']> {
    return this._once('artifacts', () => this._artifactApi.getArtifacts());
  }

  /**
   * Every recipe's every line (`GET /api/foods-recipe`, a food and a material
   * and how many - the deleted ones too): Recipe Master. One query for all of
   * them, where the foods' `/full` list asks one a food.
   */
  foodRecipes(): ReturnType<FoodApiService['getFoodRecipes']> {
    return this._once('foodRecipes', () => this._foodApi.getFoodRecipes());
  }

  private _once<T>(list: string, ask: () => Observable<T>): Observable<T> {
    const kept = this._asked.get(list);
    if (kept) {
      return kept as Observable<T>;
    }
    const asked: Observable<T> = ask().pipe(
      catchError((error: unknown) => {
        // Unless the admin panel has been opened since and a newer one stands in its place.
        if (this._asked.get(list) === asked) {
          this._asked.delete(list);
        }
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    this._asked.set(list, asked);
    return asked;
  }
}
