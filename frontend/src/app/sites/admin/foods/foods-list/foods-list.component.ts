import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FoodApiService } from '../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { SelectComponent, SelectOption, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { MultiselectComponent } from '@anotoki/lib/ui/multiselect';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';

@Component({
  selector: 'app-foods-list',
  templateUrl: './foods-list.component.html',
  styleUrls: ['./foods-list.component.scss'],
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, AnotokiDatePipe, RouterLink, ButtonComponent, TextFieldComponent, SelectComponent, MultiselectComponent],
})
export class FoodsListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'foods';

  filterId = signal('');
  filterName = signal('');
  filterTypes = signal<readonly string[]>([]);
  filterRegions = signal<readonly string[]>([]);
  /** A rarity as the select holds it, '' for any. */
  filterRarity = signal('');
  filterVersions = signal<readonly string[]>([]);

  typeOptions = this.choicesOf('type');
  regionOptions = this.choicesOf('region');
  rarityOptions = computed(() => this.distinct('rarity')().sort().reverse());
  rarityChoices = computed<SelectOption[]>(() => this.rarityOptions().map((rarity) => ({ value: rarity, label: `${rarity} ★` })));
  versionOptions = this.choicesOf('version', compareVersionsDesc);

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
