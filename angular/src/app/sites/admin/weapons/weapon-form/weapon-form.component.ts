import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { Audited, Material } from '../../../../api';
import { LookupApiService, MaterialApiService, StatApiService, WeaponApiService, WeaponFull } from '../../../../api';
import { AdminFormComponent, PendingImage } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, revokeAllPicked, toNumber, toOptionalNumber, toStringArray } from '../../shared/admin-full-resource.model';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { RefinementsTabComponent } from './refinements/refinements-tab.component';
import { AscensionsTabComponent } from './ascensions/ascensions-tab.component';
import { AscensionWrapper, emptyWeapon, RefinementWrapper, WEAPON_IMAGE_FIELDS, weaponImageName, WeaponWrapper } from './weapon-form.model';

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
  materials = signal<Audited<Material>[]>([]);

  private readonly _lookupApi = inject(LookupApiService);
  private readonly _materialApi = inject(MaterialApiService);
  private readonly _statApi = inject(StatApiService);
  private readonly _weaponApi = inject(WeaponApiService);

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
      weaponTypes: this._lookupApi.getWeaponTypes(),
      rarities: this._lookupApi.getRarities(),
      stats: this._statApi.getStats(),
      materials: this._materialApi.getMaterials(),
    }).subscribe({
      next: (result) => {
        // `rarities.name` is a SMALLINT, so this list is the one place a lookup
        // answers with numbers rather than text.
        const names = (entries: { name: string | number }[]) => entries.map((entry) => String(entry.name));
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
    return this._weaponApi.getWeaponFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._weaponApi.createWeaponFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._weaponApi.updateWeaponFull(id, payload);
  }

  protected applyLoaded(data: WeaponFull): void {
    this.weapon.set({
      data: {
        ...data.weapon,
        rarity: toNumber(data.weapon.rarity, 5),
        how_to_obtain: toStringArray(data.weapon.how_to_obtain),
        effects: toStringArray(data.weapon.effects),
      },
      pending: {},
    });
    this.refinements.set((data.refinements ?? []).map((refinement) => ({ uid: createUid(), data: refinement })));
    this.ascensions.set(
      [...(data.ascensions ?? [])]
        .sort((a, b) => a.phase - b.phase)
        .map((ascension) => ({ uid: createUid(), data: ascension, costs: ascension.costs ?? [] }))
    );
  }

  protected override beforeReload(): void {
    revokeAllPicked(Object.values(this.weapon().pending));
  }

  /**
   * Names are read now rather than when the file was picked, so renaming the
   * weapon before saving still stores its pictures under the new name.
   */
  protected override collectPendingImages(): PendingImage[] {
    const weapon = this.weapon();
    return WEAPON_IMAGE_FIELDS.filter(({ field }) => weapon.pending[field]).map(({ field }) => ({
      entity: 'weapon',
      field,
      picked: weapon.pending[field]!,
      name: weaponImageName(weapon.data.name, field),
      apply: (path: string, name: string, fileId: number | null) => {
        const data = weapon.data as unknown as Record<string, unknown>;
        data[field] = path;
        data[`${field}_name`] = name;
        data[`${field}_file_id`] = fileId;
      },
    }));
  }

  protected buildFormData(): FormData {
    const weapon = this.weapon();

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

    return buildFullFormData(payload);
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
