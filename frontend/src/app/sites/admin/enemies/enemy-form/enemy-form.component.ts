import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { Artifact, Audited, Material } from '../../../../api';
import { ArtifactApiService, EnemyApiService, LookupApiService, MaterialApiService, EnemyFull } from '../../../../api';
import { ArtifactFormData } from '../../../../sites/admin/shared/admin-form.model';
import { AdminFormComponent, PendingImage } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, revokeAllPicked, toBoolean, toNumber, toOptionalNumber } from '../../shared/admin-full-resource.model';
import { toAssetBaseName } from '../../shared/asset-name';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { PhasesTabComponent } from './phases/phases-tab.component';
import { DropsTabComponent } from './drops/drops-tab.component';
import { DropGroupWrapper, emptyEnemy, EnemyWrapper, flattenDropGroups, groupDrops, phaseImageName, PhaseImageField, PhaseWrapper } from './enemy-form.model';

@Component({
  selector: 'app-enemy-form',
  templateUrl: './enemy-form.component.html',
  styleUrls: ['./enemy-form.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TabsComponent, TabComponent, BaseInfoTabComponent, PhasesTabComponent, DropsTabComponent],
})
export class EnemyFormComponent extends AdminFormComponent<EnemyFull> implements OnInit, OnDestroy {
  readonly entityLabel = 'Enemy';
  protected readonly listRoute = '/admin/enemies';

  enemy = signal<EnemyWrapper>(emptyEnemy());
  phases = signal<PhaseWrapper[]>([]);
  dropGroups = signal<DropGroupWrapper[]>([]);

  // Lookups
  enemyTypes = signal<string[]>([]);
  enemyFamilies = signal<string[]>([]);
  enemyGroups = signal<string[]>([]);
  elements = signal<string[]>([]);
  domainLevels = signal<string[]>([]);
  materials = signal<Audited<Material>[]>([]);
  artifacts = signal<Audited<Artifact>[]>([]);

  private readonly _artifactApi = inject(ArtifactApiService);
  private readonly _enemyApi = inject(EnemyApiService);
  private readonly _lookupApi = inject(LookupApiService);
  private readonly _materialApi = inject(MaterialApiService);

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
      enemyTypes: this._lookupApi.getEnemyTypes(),
      enemyFamilies: this._lookupApi.getEnemyFamilies(),
      enemyGroups: this._lookupApi.getEnemyGroups(),
      elements: this._lookupApi.getElements(),
      domainLevels: this._lookupApi.getDomainLevels(),
      materials: this._materialApi.getMaterials(),
      artifacts: this._artifactApi.getArtifacts(),
    }).subscribe({
      next: (result) => {
        const names = (entries: { name: string }[]) => entries.map((entry) => entry.name);
        this.enemyTypes.set(names(result.enemyTypes));
        this.enemyFamilies.set(names(result.enemyFamilies));
        this.enemyGroups.set(names(result.enemyGroups));
        this.elements.set(names(result.elements));
        this.domainLevels.set(names(result.domainLevels));
        this.materials.set(result.materials);
        this.artifacts.set(result.artifacts);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<EnemyFull> {
    return this._enemyApi.getEnemyFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._enemyApi.createEnemyFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._enemyApi.updateEnemyFull(id, payload);
  }

  protected applyLoaded(data: EnemyFull): void {
    this.enemy.set({ data: data.enemy, pending: {} });
    this.phases.set(
      (data.phases ?? []).map((phase) => ({
        uid: createUid(),
        data: { ...phase, has_weakpoint: toBoolean(phase.has_weakpoint) },
        pending: {},
        elements: [...(phase.damage_type_elements ?? [])].sort((a, b) => a.order - b.order).map((entry) => entry.damage_type_element),
      }))
    );
    this.dropGroups.set(groupDrops(data.drops ?? []));
  }

  protected override beforeReload(): void {
    revokeAllPicked([...Object.values(this.enemy().pending), ...this.phases().flatMap((phase) => Object.values(phase.pending))]);
  }

  /**
   * Names are read now rather than when the file was picked, so renaming the
   * enemy before saving still stores its pictures under the new name.
   */
  protected override collectPendingImages(): PendingImage[] {
    const pending: PendingImage[] = [];
    const enemy = this.enemy();

    if (enemy.pending.icon) {
      pending.push({
        entity: 'enemy',
        field: 'icon',
        picked: enemy.pending.icon,
        name: toAssetBaseName(enemy.data.name),
        apply: (path, name, fileId) => {
          enemy.data.icon = path;
          enemy.data.icon_name = name;
          enemy.data.icon_file_id = fileId;
        },
      });
    }

    this.phases().forEach((phase, index) => {
      for (const field of ['icon', 'art'] as PhaseImageField[]) {
        const picked = phase.pending[field];
        if (!picked) {
          continue;
        }
        pending.push({
          entity: 'enemy-phase',
          field,
          picked,
          name: phaseImageName(enemy.data.name, field, index),
          apply: (path, name, fileId) => {
            phase.data[field] = path;
            phase.data[`${field}_name`] = name;
            phase.data[`${field}_file_id`] = fileId;
          },
        });
      }
    });

    return pending;
  }

  protected buildFormData(): FormData {
    const enemy = this.enemy();

    const payload = {
      enemy: enemy.data,
      phases: this.phases().map((phase) => ({
        ...phase.data,
        has_weakpoint: !!phase.data.has_weakpoint,
        // Order is the position in the list; the API stores it per element.
        damage_type_elements: phase.elements.map((element, index) => ({ damage_type_element: element, order: index + 1 })),
      })),
      // `rarity` is not edited here - it belongs to the material or artifact -
      // but it is passed through so a save does not wipe the stored value.
      drops: flattenDropGroups(this.dropGroups()).map((drop) => ({
        ...drop,
        material_id: toOptionalNumber(drop.material_id) ?? null,
        artifact_id: toOptionalNumber(drop.artifact_id) ?? null,
        level_from: toOptionalNumber(drop.level_from) ?? null,
        level_to: toOptionalNumber(drop.level_to) ?? null,
        world_level: toOptionalNumber(drop.world_level) ?? null,
        quantity_from: toOptionalNumber(drop.quantity_from) ?? null,
        quantity_to: toOptionalNumber(drop.quantity_to) ?? null,
        drop_rate: toOptionalNumber(drop.drop_rate) ?? null,
        average: toOptionalNumber(drop.average) ?? null,
        rarity: toOptionalNumber(drop.rarity) ?? null,
      })),
    };

    return buildFullFormData(payload);
  }

  protected override extraValidation(): string | undefined {
    const groups = this.dropGroups();
    for (let g = 0; g < groups.length; g++) {
      const index = groups[g].entries.findIndex((entry) =>
        entry.kind === 'material' ? !toNumber(entry.data.material_id) : !toNumber(entry.data.artifact_id)
      );
      if (index >= 0) {
        return `Group ${g + 1}, drop ${index + 1} has no ${groups[g].entries[index].kind} selected.`;
      }
    }
    return undefined;
  }
}
