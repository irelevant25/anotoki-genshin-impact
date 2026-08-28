import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminApiService } from '../../services/admin-api.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';
import { toBoolean } from '../../shared/admin-full-resource.model';

@Component({
  selector: 'app-artifacts-list',
  templateUrl: './artifacts-list.component.html',
  styleUrls: ['./artifacts-list.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TextComponent, MultiselectComponent],
})
export class ArtifactsListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'artifacts';

  filterId = signal<string | number | null | undefined>('');
  filterName = signal<string | number | null | undefined>('');
  filterRarities = signal<(string | number | boolean)[] | null | undefined>([]);
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  readonly rarityOptions = ['5', '4', '3', '2', '1'];
  versionOptions = this.distinct('version', compareVersionsDesc);

  sorted = computed(() => [...this.rows()].sort((a, b) => String(a.name).localeCompare(String(b.name))));

  filtered = computed(() => {
    const rarities = (this.filterRarities() ?? []).map((value) => String(value));
    return this.sorted().filter(
      (row) =>
        contains(row.id, this.filterId()) &&
        contains(row.name, this.filterName()) &&
        includedIn(row.version, this.filterVersions()) &&
        (rarities.length === 0 || rarities.some((rarity) => toBoolean(row[`has_rarity_${rarity}`])))
    );
  });

  hasActiveFilter = computed(
    () =>
      !!String(this.filterId() ?? '').trim() ||
      !!String(this.filterName() ?? '').trim() ||
      (this.filterRarities() ?? []).length > 0 ||
      (this.filterVersions() ?? []).length > 0
  );

  private readonly _api = inject(AdminApiService);

  ngOnInit(): void {
    this.load();
  }

  protected fetch(): Observable<any[]> {
    return this._api.getArtifacts();
  }

  protected remove(id: number): Observable<unknown> {
    return this._api.deleteArtifact(id);
  }

  /** The rarities an artifact set actually drops at, from its has_rarity_N flags. */
  raritiesOf(row: Record<string, unknown>): string {
    const available = [1, 2, 3, 4, 5].filter((rarity) => toBoolean(row[`has_rarity_${rarity}`]));
    return available.length ? available.join(', ') : '—';
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterRarities.set([]);
    this.filterVersions.set([]);
  }
}
