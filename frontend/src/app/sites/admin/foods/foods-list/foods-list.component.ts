import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FoodApiService } from '../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { SelectComponent, SelectOption, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';

@Component({
  selector: 'app-foods-list',
  templateUrl: './foods-list.component.html',
  styleUrls: ['./foods-list.component.scss'],
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, AppDatePipe, RouterLink, ButtonComponent, TextFieldComponent, SelectComponent, MultiselectComponent],
})
export class FoodsListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'foods';

  filterId = signal('');
  filterName = signal('');
  filterTypes = signal<(string | number | boolean)[] | null | undefined>([]);
  filterRegions = signal<(string | number | boolean)[] | null | undefined>([]);
  /** A rarity as the select holds it, '' for any. */
  filterRarity = signal('');
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  typeOptions = this.distinct('type');
  regionOptions = this.distinct('region');
  rarityOptions = computed(() => this.distinct('rarity')().sort().reverse());
  rarityChoices = computed<SelectOption[]>(() => this.rarityOptions().map((rarity) => ({ value: rarity, label: `${rarity} ★` })));
  versionOptions = this.distinct('version', compareVersionsDesc);

  sorted = computed(() => [...this.rows()].sort((a, b) => String(a.name).localeCompare(String(b.name))));

  filtered = computed(() => {
    const rarity = this.filterRarity();
    return this.sorted().filter(
      (row) =>
        contains(row.id, this.filterId()) &&
        contains(row.name, this.filterName()) &&
        includedIn(row.type, this.filterTypes()) &&
        includedIn(row.region, this.filterRegions()) &&
        includedIn(row.version, this.filterVersions()) &&
        // Loose compare: the dropdown hands back the option key as a string.
        (rarity === undefined || rarity === null || rarity === '' || row.rarity == rarity),
    );
  });

  hasActiveFilter = computed(
    () =>
      !!String(this.filterId() ?? '').trim() ||
      !!String(this.filterName() ?? '').trim() ||
      (this.filterTypes() ?? []).length > 0 ||
      (this.filterRegions() ?? []).length > 0 ||
      (this.filterVersions() ?? []).length > 0 ||
      (this.filterRarity() !== undefined && this.filterRarity() !== null && this.filterRarity() !== ''),
  );

  private readonly _foodApi = inject(FoodApiService);

  ngOnInit(): void {
    this.load();
  }

  protected fetch(): Observable<any[]> {
    return this._foodApi.getFoods() as unknown as Observable<any[]>;
  }

  protected remove(id: number): Observable<unknown> {
    return this._foodApi.deleteFood(id);
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterTypes.set([]);
    this.filterRegions.set([]);
    this.filterRarity.set('');
    this.filterVersions.set([]);
  }
}
