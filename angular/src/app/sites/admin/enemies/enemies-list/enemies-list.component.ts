import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EnemyApiService } from '../../../../api';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';

@Component({
  selector: 'app-enemies-list',
  templateUrl: './enemies-list.component.html',
  styleUrls: ['./enemies-list.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TextComponent, MultiselectComponent],
})
export class EnemiesListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'enemies';

  filterId = signal<string | number | null | undefined>('');
  filterName = signal<string | number | null | undefined>('');
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  versionOptions = this.distinct('version', compareVersionsDesc);

  sorted = computed(() => [...this.rows()].sort((a, b) => compareVersionsDesc(a.version, b.version) || String(a.name).localeCompare(String(b.name))));

  filtered = computed(() =>
    this.sorted().filter(
      (row) => contains(row.id, this.filterId()) && contains(row.name, this.filterName()) && includedIn(row.version, this.filterVersions())
    )
  );

  hasActiveFilter = computed(
    () => !!String(this.filterId() ?? '').trim() || !!String(this.filterName() ?? '').trim() || (this.filterVersions() ?? []).length > 0
  );

  private readonly _enemyApi = inject(EnemyApiService);

  ngOnInit(): void {
    this.load();
  }

  protected fetch(): Observable<any[]> {
    return this._enemyApi.getEnemies();
  }

  protected remove(id: number): Observable<unknown> {
    return this._enemyApi.deleteEnemy(id);
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterVersions.set([]);
  }
}
