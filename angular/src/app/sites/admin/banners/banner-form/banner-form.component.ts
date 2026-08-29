import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { CalendarComponent } from '../../../../shared/local-lib/components/calendar/calendar.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { FieldContainerComponent } from '../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../shared/local-lib/components/tooltip/tooltip.component';
import { DropdownOption } from '../../../../shared/local-lib/services/options-helper.service';
import { AdminApiService, BannerFormData, BannerFull } from '../../services/admin-api.service';
import { AdminFormComponent } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, resequence, toNumber } from '../../shared/admin-full-resource.model';
import { MaterialIconDirective } from '../../shared/material-icon.directive';

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
    RouterLink,
    ButtonComponent,
    LoaderComponent,
    TextComponent,
    CalendarComponent,
    DropdownComponent,
    FieldContainerComponent,
    TooltipComponent,
    MaterialIconDirective,
  ],
})
export class BannerFormComponent extends AdminFormComponent<BannerFull> implements OnInit {
  readonly entityLabel = 'Banner';
  protected readonly listRoute = '/admin/banners';

  banner = signal<BannerFormData>({ name: '', version: '', duration_from: '' });
  characters = signal<FeaturedWrapper[]>([]);
  weapons = signal<FeaturedWrapper[]>([]);

  characterOptions = signal<DropdownOption[]>([]);
  weaponOptions = signal<DropdownOption[]>([]);

  /** Art has no column; it is named "{version} - {name}". */
  artName = computed(() => `${this.banner().version} - ${this.banner().name}`);

  private readonly _api = inject(AdminApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({ characters: this._api.getCharacters(), weapons: this._api.getWeapons() }).subscribe({
      next: (result) => {
        this.characterOptions.set(
          (result.characters ?? [])
            .map((entry: any) => ({ key: entry.id, value: `${entry.name}${entry.element ? ' (' + entry.element + ')' : ''}` }))
            .sort((a, b) => String(a.value).localeCompare(String(b.value)))
        );
        this.weaponOptions.set(
          (result.weapons ?? []).map((entry: any) => ({ key: entry.id, value: entry.name })).sort((a, b) => String(a.value).localeCompare(String(b.value)))
        );
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<BannerFull> {
    return this._api.getBannerFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._api.createBannerFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._api.updateBannerFull(id, payload);
  }

  protected applyLoaded(data: BannerFull): void {
    this.banner.set(data.banner);
    this.characters.set(
      [...(data.characters ?? [])].sort((a, b) => a.order - b.order).map((entry) => ({ uid: createUid(), id: entry.character_id, order: entry.order }))
    );
    this.weapons.set([...(data.weapons ?? [])].sort((a, b) => a.order - b.order).map((entry) => ({ uid: createUid(), id: entry.weapon_id, order: entry.order })));
  }

  protected buildFormData(): FormData {
    return buildFullFormData(
      {
        banner: this.banner(),
        characters: this.characters().map((entry, index) => ({ character_id: toNumber(entry.id), order: index + 1 })),
        weapons: this.weapons().map((entry, index) => ({ weapon_id: toNumber(entry.id), order: index + 1 })),
      },
      []
    );
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
        (current, order) => (current.order = order)
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
