import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { DropdownOption } from '../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../shared/models.generated';
import { AdminApiService, FoodFull, IdNameEntry } from '../../services/admin-api.service';
import { AdminFormComponent } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, parentFileKey, revokeImages, toNumber, toOptionalNumber, toStringArray, UploadPart } from '../../shared/admin-full-resource.model';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { QualitiesTabComponent } from './qualities/qualities-tab.component';
import { RecipeTabComponent } from './recipe/recipe-tab.component';
import { emptyFood, FOOD_QUALITIES, FoodWrapper, RecipeWrapper } from './food-form.model';

@Component({
  selector: 'app-food-form',
  templateUrl: './food-form.component.html',
  styleUrls: ['./food-form.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TabsComponent, TabComponent, BaseInfoTabComponent, QualitiesTabComponent, RecipeTabComponent],
})
export class FoodFormComponent extends AdminFormComponent<FoodFull> implements OnInit, OnDestroy {
  readonly entityLabel = 'Food';
  protected readonly listRoute = '/admin/foods';

  food = signal<FoodWrapper>(emptyFood());
  recipe = signal<RecipeWrapper[]>([]);

  foodTypes = signal<string[]>([]);
  regions = signal<string[]>([]);
  rarities = signal<string[]>([]);
  materials = signal<Material[]>([]);
  foods = signal<IdNameEntry[]>([]);

  /** A dish can be the upgraded form of another; it must not point at itself. */
  baseDishOptions = computed<DropdownOption[]>(() =>
    this.foods()
      .filter((food) => food.id !== this.entityId())
      .map((food) => ({ key: food.id, value: food.name }))
  );

  private readonly _api = inject(AdminApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  ngOnDestroy(): void {
    this.beforeReload();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({
      foodTypes: this._api.getFoodTypes(),
      regions: this._api.getRegions(),
      rarities: this._api.getRarities(),
      materials: this._api.getMaterials(),
      foods: this._api.getFoods(),
    }).subscribe({
      next: (result) => {
        const names = (entries: { name: string }[]) => entries.map((entry) => entry.name);
        this.foodTypes.set(names(result.foodTypes));
        this.regions.set(names(result.regions));
        this.rarities.set(names(result.rarities).sort().reverse());
        this.materials.set(result.materials);
        this.foods.set(result.foods);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<FoodFull> {
    return this._api.getFoodFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._api.createFoodFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._api.updateFoodFull(id, payload);
  }

  protected applyLoaded(data: FoodFull): void {
    this.food.set({
      data: {
        ...data.food,
        rarity: toOptionalNumber(data.food.rarity) ?? null,
        proficiency: toOptionalNumber(data.food.proficiency) ?? null,
        base_dish_id: toOptionalNumber(data.food.base_dish_id) ?? null,
        events: toStringArray(data.food.events),
        how_to_obtain: toStringArray(data.food.how_to_obtain),
        effects: toStringArray(data.food.effects),
      },
      images: {},
    });
    this.recipe.set((data.recipe ?? []).map((entry) => ({ uid: createUid(), data: entry })));
  }

  protected override beforeReload(): void {
    revokeImages(Object.values(this.food().images));
  }

  protected buildFormData(): FormData {
    const food = this.food();
    const uploads: UploadPart[] = [];
    for (const { quality } of FOOD_QUALITIES) {
      const field = `icon_${quality}` as const;
      const file = food.images[field]?.file;
      if (file) {
        uploads.push({ key: parentFileKey(field), file });
      }
    }

    const payload = {
      food: {
        ...food.data,
        rarity: toOptionalNumber(food.data.rarity) ?? null,
        proficiency: toOptionalNumber(food.data.proficiency) ?? null,
        base_dish_id: toOptionalNumber(food.data.base_dish_id) ?? null,
        events: toStringArray(food.data.events),
        how_to_obtain: toStringArray(food.data.how_to_obtain),
        effects: toStringArray(food.data.effects),
      },
      recipe: this.recipe().map((entry) => ({
        material_id: toNumber(entry.data.material_id),
        quantity: toNumber(entry.data.quantity, 1),
      })),
    };

    return buildFullFormData(payload, uploads);
  }

  protected override extraValidation(): string | undefined {
    const materialIds = this.recipe().map((entry) => entry.data.material_id);
    if (new Set(materialIds).size !== materialIds.length) {
      return 'The recipe lists the same material twice.';
    }
    return undefined;
  }
}
