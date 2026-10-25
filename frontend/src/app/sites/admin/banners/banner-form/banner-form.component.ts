import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { DateFieldComponent } from '@anotoki/lib/ui/date-field';
import { DropdownOption } from '../../../../shared/local-lib/services/options-helper.service';
import { FieldCheckDirective } from '../../../../shared/local-lib/fields/field-check';
import { fieldText } from '../../../../shared/local-lib/fields/field-text';
import { ChoiceFieldDirective } from '../../../../shared/local-lib/fields/choice-field.directive';
import { fieldDateToStored, storedToFieldDate } from '../../../../shared/local-lib/stored-dates';
import { BannerApiService, CharacterApiService, WeaponApiService, BannerFull } from '../../../../api';
import { BannerFormData } from '../../../../sites/admin/shared/admin-form.model';
import { AdminFormComponent, PendingImage } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, resequence, revokePicked, toNumber } from '../../shared/admin-full-resource.model';
import { EntityImageComponent } from '../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { toAssetLiteralName } from '../../shared/asset-name';

interface FeaturedWrapper {
  uid: number;
  id?: number;
  order: number;
}

@Component({
  selector: 'app-banner-form',
  templateUrl: './banner-form.component.html',
  styleUrls: ['./banner-form.component.scss'],
  imports: [
    PageHeaderComponent,
    IconComponent,
    SpinnerComponent,
    TooltipDirective,
    RouterLink,
    ButtonComponent,
    TextFieldComponent,
    SelectComponent,
    DateFieldComponent,
    FieldCheckDirective,
    ChoiceFieldDirective,
    EntityImageComponent,
  ],
})
export class BannerFormComponent extends AdminFormComponent<BannerFull> implements OnInit {
  readonly entityLabel = 'Banner';
  protected readonly listRoute = '/admin/banners';

  readonly fieldText = fieldText;
  /** A run's day as the kit's date field reads it, and back as the API keeps it (stored-dates.ts). */
  readonly storedToFieldDate = storedToFieldDate;
  readonly fieldDateToStored = fieldDateToStored;

  /**
   * The run's first day as the field says it, as the API keeps it - null once the field holds no date, which the
   * required check then says (the column's type has no null, but a cleared date is kept and sent as null, as ever).
   */
  onFromChange(field: string): void {
    (this.banner() as { duration_from: string | null }).duration_from = fieldDateToStored(field);
  }

  banner = signal<BannerFormData>({ name: '', version: '', duration_from: '' });
  characters = signal<FeaturedWrapper[]>([]);
  weapons = signal<FeaturedWrapper[]>([]);

  characterOptions = signal<DropdownOption[]>([]);
  weaponOptions = signal<DropdownOption[]>([]);

  /** Banner art is filed as "{version} - {name}", kept as typed. */
  artName = computed(() => toAssetLiteralName(`${this.banner().version} - ${this.banner().name}`));
  /** Picked but not uploaded yet; sent when the form is saved. */
  pendingArt = signal<PickedImage | undefined>(undefined);

  private readonly _bannerApi = inject(BannerApiService);
  private readonly _characterApi = inject(CharacterApiService);
  private readonly _weaponApi = inject(WeaponApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({ characters: this._characterApi.getCharacters(), weapons: this._weaponApi.getWeapons() }).subscribe({
      next: (result) => {
        this.characterOptions.set(
          (result.characters ?? [])
            .map((entry: any) => ({ key: entry.id, value: `${entry.name}${entry.element ? ` (${entry.element})` : ''}` }))
            .sort((a, b) => String(a.value).localeCompare(String(b.value))),
        );
        this.weaponOptions.set((result.weapons ?? []).map((entry: any) => ({ key: entry.id, value: entry.name })).sort((a, b) => String(a.value).localeCompare(String(b.value))));
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.error('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<BannerFull> {
    return this._bannerApi.getBannerFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._bannerApi.createBannerFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._bannerApi.updateBannerFull(id, payload);
  }

  protected applyLoaded(data: BannerFull): void {
    this.banner.set(data.banner);
    this.characters.set([...(data.characters ?? [])].sort((a, b) => a.order - b.order).map((entry) => ({ uid: createUid(), id: entry.character_id, order: entry.order })));
    this.weapons.set([...(data.weapons ?? [])].sort((a, b) => a.order - b.order).map((entry) => ({ uid: createUid(), id: entry.weapon_id, order: entry.order })));
  }

  // ── Art ─────────────────────────────────────────────────────────────────────────

  onArtPicked(picked: PickedImage): void {
    revokePicked(this.pendingArt());
    this.pendingArt.set(picked);
  }

  onArtCleared(): void {
    revokePicked(this.pendingArt());
    this.pendingArt.set(undefined);
  }

  protected override beforeReload(): void {
    revokePicked(this.pendingArt());
    this.pendingArt.set(undefined);
  }

  /**
   * The name is read now rather than when the file was picked, so editing the
   * version or name before saving still stores the art under the new name.
   */
  protected override collectPendingImages(): PendingImage[] {
    const picked = this.pendingArt();
    if (!picked) {
      return [];
    }
    return [
      {
        entity: 'banner',
        field: 'icon',
        picked,
        name: this.artName(),
        apply: (path: string, name: string, fileId: number | null) => this.banner.update((banner) => ({ ...banner, icon: path, icon_name: name, icon_file_id: fileId })),
      },
    ];
  }

  protected buildFormData(): FormData {
    return buildFullFormData({
      banner: this.banner(),
      characters: this.characters().map((entry, index) => ({ character_id: toNumber(entry.id), order: index + 1 })),
      weapons: this.weapons().map((entry, index) => ({ weapon_id: toNumber(entry.id), order: index + 1 })),
    });
  }

  protected override extraValidation(): string | undefined {
    for (const [label, list] of [
      ['character', this.characters()],
      ['weapon', this.weapons()],
    ] as const) {
      const ids = list.map((entry) => entry.id).filter((id) => id !== undefined);
      if (ids.length !== list.length) {
        return `Every featured ${label} needs to be picked.`;
      }
      if (new Set(ids).size !== ids.length) {
        return `The same ${label} is featured twice.`;
      }
    }
    return undefined;
  }

  // ── Featured lists ──────────────────────────────────────────────────────────

  add(list: 'characters' | 'weapons'): void {
    const target = list === 'characters' ? this.characters : this.weapons;
    target.update((entries) => [...entries, { uid: createUid(), order: entries.length + 1 }]);
  }

  remove(list: 'characters' | 'weapons', entry: FeaturedWrapper): void {
    const target = list === 'characters' ? this.characters : this.weapons;
    target.update((entries) => {
      const remaining = entries.filter((current) => current !== entry);
      resequence(
        remaining,
        (current) => current.order,
        (current, order) => (current.order = order),
      );
      return remaining;
    });
  }

  /** Order is the row's position, so moving a row is the only way to change it. */
  move(list: 'characters' | 'weapons', entry: FeaturedWrapper, offset: number): void {
    const target = list === 'characters' ? this.characters : this.weapons;
    target.update((entries) => {
      const index = entries.indexOf(entry);
      const to = index + offset;
      if (index < 0 || to < 0 || to >= entries.length) {
        return entries;
      }
      const next = [...entries];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }
}
