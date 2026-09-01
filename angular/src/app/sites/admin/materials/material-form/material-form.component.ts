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
import { LookupApiService, MaterialApiService, MaterialFull } from '../../../../api';
import { MaterialFormData } from '../../../../sites/admin/shared/admin-form.model';
import { AdminFormComponent, PendingImage } from '../../shared/admin-form.class';
import { buildFullFormData, revokePicked, toLines, toOptionalNumber, toStringArray } from '../../shared/admin-full-resource.model';
import { EntityImageComponent } from '../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { toAssetLiteralName } from '../../shared/asset-name';

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
    EntityImageComponent,
  ],
})
export class MaterialFormComponent extends AdminFormComponent<MaterialFull> implements OnInit {
  readonly entityLabel = 'Material';
  protected readonly listRoute = '/admin/materials';

  material = signal<MaterialFormData>({ name: '' });
  /** Picked but not uploaded yet; sent when the form is saved. */
  pendingIcon = signal<PickedImage | undefined>(undefined);
  /** Extra groups, stored in the join table alongside the primary `group`. */
  groups = signal<(string | number | boolean)[]>([]);

  materialTypes = signal<string[]>([]);
  materialGroups = signal<string[]>([]);
  regions = signal<string[]>([]);
  rarities = signal<string[]>([]);

  howToObtainText = computed(() => toStringArray(this.material().how_to_obtain).join('\n'));

  private readonly _lookupApi = inject(LookupApiService);
  private readonly _materialApi = inject(MaterialApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({
      materialTypes: this._lookupApi.getMaterialTypes(),
      materialGroups: this._lookupApi.getMaterialGroups(),
      regions: this._lookupApi.getRegions(),
      rarities: this._lookupApi.getRarities(),
    }).subscribe({
      next: (result) => {
        // `rarities.name` is a SMALLINT, so this list is the one place a lookup
        // answers with numbers rather than text.
        const names = (entries: { name: string | number }[]) => entries.map((entry) => String(entry.name));
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
    return this._materialApi.getMaterialFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._materialApi.createMaterialFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._materialApi.updateMaterialFull(id, payload);
  }

  protected applyLoaded(data: MaterialFull): void {
    this.material.set({
      ...data.material,
      rarity: toOptionalNumber(data.material.rarity) ?? null,
      how_to_obtain: toStringArray(data.material.how_to_obtain),
    });
    this.groups.set((data.groups ?? []).map((entry) => entry.group).filter((group): group is string => !!group));
  }

  // ── Icon ────────────────────────────────────────────────────────────────────────

  /** Material art is resolved by display name, so it is stored as typed. */
  iconName = computed(() => toAssetLiteralName(this.material().name));

  onIconPicked(picked: PickedImage): void {
    revokePicked(this.pendingIcon());
    this.pendingIcon.set(picked);
  }

  onIconCleared(): void {
    revokePicked(this.pendingIcon());
    this.pendingIcon.set(undefined);
  }

  protected override beforeReload(): void {
    revokePicked(this.pendingIcon());
    this.pendingIcon.set(undefined);
  }

  /**
   * The name is read now rather than when the file was picked, so renaming the
   * material before saving still stores its picture under the new name.
   */
  protected override collectPendingImages(): PendingImage[] {
    const picked = this.pendingIcon();
    if (!picked) {
      return [];
    }
    return [
      {
        entity: 'material',
        field: 'icon',
        picked,
        name: this.iconName(),
        // Written through the signal: editing a field replaces the object, so a
        // reference taken here would not be the one that gets sent.
        apply: (path: string, name: string) => this.material.update((material) => ({ ...material, icon: path, icon_name: name })),
      },
    ];
  }

  onHowToObtainChange(value: string | number | undefined | null): void {
    this.material.update((material) => ({ ...material, how_to_obtain: toLines(value) }));
  }

  protected buildFormData(): FormData {
    const material = this.material();
    return buildFullFormData({
      material: {
        ...material,
        rarity: toOptionalNumber(material.rarity) ?? null,
        how_to_obtain: toStringArray(material.how_to_obtain),
      },
      groups: this.groups().map((group) => ({ group: String(group) })),
    });
  }
}
