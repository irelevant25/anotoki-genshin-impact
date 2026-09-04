import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { WeaponApiService } from '../../../../api';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';

@Component({
  selector: 'app-weapons-list',
  templateUrl: './weapons-list.component.html',
  styleUrls: ['./weapons-list.component.scss'],
  imports: [AppDatePipe, RouterLink, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent, MultiselectComponent],
})
export class WeaponsListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'weapons';

  filterId = signal<string | number | null | undefined>('');
  filterName = signal<string | number | null | undefined>('');
  filterTypes = signal<(string | number | boolean)[] | null | undefined>([]);
  filterRarity = signal<string | number | boolean | null | undefined>(undefined);
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  typeOptions = this.distinct('type');
  rarityOptions = computed(() => this.distinct('rarity')().sort().reverse());
  versionOptions = this.distinct('version', compareVersionsDesc);

  sorted = computed(() => [...this.rows()].sort((a, b) => String(a.name).localeCompare(String(b.name))));

  filtered = computed(() => {
    const rarity = this.filterRarity();
    return this.sorted().filter(
      (row) =>
        contains(row.id, this.filterId()) &&
        contains(row.name, this.filterName()) &&
        includedIn(row.type, this.filterTypes()) &&
        includedIn(row.version, this.filterVersions()) &&
        // Loose compare: the dropdown hands back the option key as a string.
        (rarity === undefined || rarity === null || rarity === '' || row.rarity == rarity)
    );
  });

  hasActiveFilter = computed(
    () =>
      !!String(this.filterId() ?? '').trim() ||
      !!String(this.filterName() ?? '').trim() ||
      (this.filterTypes() ?? []).length > 0 ||
      (this.filterVersions() ?? []).length > 0 ||
      (this.filterRarity() !== undefined && this.filterRarity() !== null && this.filterRarity() !== '')
  );

  private readonly _weaponApi = inject(WeaponApiService);

  ngOnInit(): void {
    this.load();
  }

  protected fetch(): Observable<any[]> {
    return this._weaponApi.getWeapons();
  }

  protected remove(id: number): Observable<unknown> {
    return this._weaponApi.deleteWeapon(id);
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterTypes.set([]);
    this.filterRarity.set(undefined);
    this.filterVersions.set([]);
  }
}
