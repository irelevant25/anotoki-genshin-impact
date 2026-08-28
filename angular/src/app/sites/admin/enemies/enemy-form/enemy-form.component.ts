import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { Material } from '../../../../shared/models.generated';
import { AdminApiService, ArtifactFormData, EnemyFull } from '../../services/admin-api.service';
import { AdminFormComponent } from '../../shared/admin-form.class';
import {
  buildFullFormData,
  childFileKey,
  createUid,
  parentFileKey,
  revokeImages,
  toBoolean,
  toNumber,
  toOptionalNumber,
  UploadPart,
} from '../../shared/admin-full-resource.model';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { PhasesTabComponent } from './phases/phases-tab.component';
import { DropsTabComponent } from './drops/drops-tab.component';
import { DropGroupWrapper, emptyEnemy, EnemyWrapper, flattenDropGroups, groupDrops, PhaseWrapper } from './enemy-form.model';

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
  materials = signal<Material[]>([]);
  artifacts = signal<ArtifactFormData[]>([]);

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
      enemyTypes: this._api.getEnemyTypes(),
      enemyFamilies: this._api.getEnemyFamilies(),
      enemyGroups: this._api.getEnemyGroups(),
      elements: this._api.getElements(),
      domainLevels: this._api.getDomainLevels(),
      materials: this._api.getMaterials(),
      artifacts: this._api.getArtifacts(),
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
    return this._api.getEnemyFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._api.createEnemyFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._api.updateEnemyFull(id, payload);
  }

  protected applyLoaded(data: EnemyFull): void {
    this.enemy.set({ data: data.enemy, images: {} });
    this.phases.set(
      (data.phases ?? []).map((phase) => ({
        uid: createUid(),
        data: { ...phase, has_weakpoint: toBoolean(phase.has_weakpoint) },
        images: {},
        elements: [...(phase.damage_type_elements ?? [])].sort((a, b) => a.order - b.order).map((entry) => entry.damage_type_element),
      }))
    );
    this.dropGroups.set(groupDrops(data.drops ?? []));
  }

  protected override beforeReload(): void {
    revokeImages([...Object.values(this.enemy().images), ...this.phases().flatMap((phase) => Object.values(phase.images))]);
  }

  protected buildFormData(): FormData {
    const enemy = this.enemy();
    const uploads: UploadPart[] = [];

    if (enemy.images.icon?.file) {
      uploads.push({ key: parentFileKey('icon'), file: enemy.images.icon.file });
    }
    this.phases().forEach((phase, index) => {
      for (const field of ['icon', 'art'] as const) {
        const file = phase.images[field]?.file;
        if (file) {
          uploads.push({ key: childFileKey('phases', index, field), file });
        }
      }
    });

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

    return buildFullFormData(payload, uploads);
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
