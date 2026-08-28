import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { Material } from '../../../../shared/models.generated';
import { AdminApiService, WeaponFull } from '../../services/admin-api.service';
import { AdminFormComponent } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, parentFileKey, revokeImages, toNumber, toOptionalNumber, toStringArray, UploadPart } from '../../shared/admin-full-resource.model';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { RefinementsTabComponent } from './refinements/refinements-tab.component';
import { AscensionsTabComponent } from './ascensions/ascensions-tab.component';
import { AscensionWrapper, emptyWeapon, RefinementWrapper, WEAPON_IMAGE_FIELDS, WeaponWrapper } from './weapon-form.model';

@Component({
  selector: 'app-weapon-form',
  templateUrl: './weapon-form.component.html',
  styleUrls: ['./weapon-form.component.scss'],
  imports: [
    RouterLink,
    ButtonComponent,
    LoaderComponent,
    TabsComponent,
    TabComponent,
    BaseInfoTabComponent,
    RefinementsTabComponent,
    AscensionsTabComponent,
  ],
})
export class WeaponFormComponent extends AdminFormComponent<WeaponFull> implements OnInit, OnDestroy {
  readonly entityLabel = 'Weapon';
  protected readonly listRoute = '/admin/weapons';

  weapon = signal<WeaponWrapper>(emptyWeapon());
  refinements = signal<RefinementWrapper[]>([]);
  ascensions = signal<AscensionWrapper[]>([]);

  weaponTypes = signal<string[]>([]);
  rarities = signal<string[]>([]);
  stats = signal<string[]>([]);
  materials = signal<Material[]>([]);

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
      weaponTypes: this._api.getWeaponTypes(),
      rarities: this._api.getRarities(),
      stats: this._api.getStats(),
      materials: this._api.getMaterials(),
    }).subscribe({
      next: (result) => {
        const names = (entries: { name: string }[]) => entries.map((entry) => entry.name);
        this.weaponTypes.set(names(result.weaponTypes));
        this.rarities.set(names(result.rarities).sort().reverse());
        this.stats.set(names(result.stats));
        this.materials.set(result.materials);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<WeaponFull> {
    return this._api.getWeaponFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._api.createWeaponFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._api.updateWeaponFull(id, payload);
  }

  protected applyLoaded(data: WeaponFull): void {
    this.weapon.set({
      data: {
        ...data.weapon,
        rarity: toNumber(data.weapon.rarity, 5),
        how_to_obtain: toStringArray(data.weapon.how_to_obtain),
        effects: toStringArray(data.weapon.effects),
      },
      images: {},
    });
    this.refinements.set((data.refinements ?? []).map((refinement) => ({ uid: createUid(), data: refinement })));
    this.ascensions.set(
      [...(data.ascensions ?? [])]
        .sort((a, b) => a.phase - b.phase)
        .map((ascension) => ({ uid: createUid(), data: ascension, costs: ascension.costs ?? [] }))
    );
  }

  protected override beforeReload(): void {
    revokeImages(Object.values(this.weapon().images));
  }

  protected buildFormData(): FormData {
    const weapon = this.weapon();
    const uploads: UploadPart[] = [];
    for (const { field } of WEAPON_IMAGE_FIELDS) {
      const file = weapon.images[field]?.file;
      if (file) {
        uploads.push({ key: parentFileKey(field), file });
      }
    }

    const payload = {
      weapon: {
        ...weapon.data,
        rarity: toNumber(weapon.data.rarity, 5),
        how_to_obtain: toStringArray(weapon.data.how_to_obtain),
        effects: toStringArray(weapon.data.effects),
      },
      // Position in the list is the refinement level.
      refinements: this.refinements().map((refinement) => ({
        ...refinement.data,
        material_id: toNumber(refinement.data.material_id),
        quantity: toNumber(refinement.data.quantity),
        description: refinement.data.description ?? '',
      })),
      ascensions: this.ascensions().map((ascension) => ({
        ...ascension.data,
        phase: toNumber(ascension.data.phase),
        primary_stat_value: toNumber(ascension.data.primary_stat_value),
        secondary_stat_value: toNumber(ascension.data.secondary_stat_value),
        start_level_from: toOptionalNumber(ascension.data.start_level_from) ?? null,
        start_level_to: toOptionalNumber(ascension.data.start_level_to) ?? null,
        end_level_from: toOptionalNumber(ascension.data.end_level_from) ?? null,
        end_level_to: toOptionalNumber(ascension.data.end_level_to) ?? null,
        costs: ascension.costs.map((cost) => ({ material_id: toNumber(cost.material_id), quantity: toNumber(cost.quantity, 1) })),
      })),
    };

    return buildFullFormData(payload, uploads);
  }

  protected override extraValidation(): string | undefined {
    for (const ascension of this.ascensions()) {
      const materialIds = ascension.costs.map((cost) => cost.material_id).filter((id) => id !== undefined);
      if (new Set(materialIds).size !== materialIds.length) {
        return `Ascension phase ${ascension.data.phase} lists the same material twice.`;
      }
    }
    return undefined;
  }
}
