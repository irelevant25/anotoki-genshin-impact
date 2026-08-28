import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { FieldContainerComponent } from '../../../../shared/local-lib/components/field-container/field-container.component';
import { AdminApiService, MaterialFormData, MaterialFull } from '../../services/admin-api.service';
import { AdminFormComponent } from '../../shared/admin-form.class';
import { buildFullFormData, toLines, toOptionalNumber, toStringArray } from '../../shared/admin-full-resource.model';

@Component({
  selector: 'app-material-form',
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.scss'],
  imports: [
    RouterLink,
    ButtonComponent,
    LoaderComponent,
    TextComponent,
    TextareaComponent,
    DropdownComponent,
    MultiselectComponent,
    FieldContainerComponent,
  ],
})
export class MaterialFormComponent extends AdminFormComponent<MaterialFull> implements OnInit {
  readonly entityLabel = 'Material';
  protected readonly listRoute = '/admin/materials';

  material = signal<MaterialFormData>({ name: '' });
  /** Extra groups, stored in the join table alongside the primary `group`. */
  groups = signal<(string | number | boolean)[]>([]);

  materialTypes = signal<string[]>([]);
  materialGroups = signal<string[]>([]);
  regions = signal<string[]>([]);
  rarities = signal<string[]>([]);

  howToObtainText = computed(() => (this.material().how_to_obtain ?? []).join('\n'));

  private readonly _api = inject(AdminApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({
      materialTypes: this._api.getMaterialTypes(),
      materialGroups: this._api.getMaterialGroups(),
      regions: this._api.getRegions(),
      rarities: this._api.getRarities(),
    }).subscribe({
      next: (result) => {
        const names = (entries: { name: string }[]) => entries.map((entry) => entry.name);
        this.materialTypes.set(names(result.materialTypes));
        this.materialGroups.set(names(result.materialGroups));
        this.regions.set(names(result.regions));
        this.rarities.set(names(result.rarities).sort().reverse());
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<MaterialFull> {
    return this._api.getMaterialFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._api.createMaterialFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._api.updateMaterialFull(id, payload);
  }

  protected applyLoaded(data: MaterialFull): void {
    this.material.set({
      ...data.material,
      rarity: toOptionalNumber(data.material.rarity) ?? null,
      how_to_obtain: toStringArray(data.material.how_to_obtain),
    });
    this.groups.set((data.groups ?? []).map((entry) => entry.group).filter((group): group is string => !!group));
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.material.update((material) => ({ ...material, how_to_obtain: toLines(value) }));
  }

  protected buildFormData(): FormData {
    const material = this.material();
    return buildFullFormData(
      {
        material: {
          ...material,
          rarity: toOptionalNumber(material.rarity) ?? null,
          how_to_obtain: toStringArray(material.how_to_obtain),
        },
        groups: this.groups().map((group) => ({ group: String(group) })),
      },
      []
    );
  }
}
