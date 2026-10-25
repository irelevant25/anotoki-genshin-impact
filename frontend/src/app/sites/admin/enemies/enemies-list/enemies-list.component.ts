import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EnemyApiService } from '../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { MultiselectComponent } from '@anotoki/lib/ui/multiselect';
import { AdminListComponent, compareVersionsDesc, contains, includedIn } from '../../shared/admin-list.class';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';

@Component({
  selector: 'app-enemies-list',
  templateUrl: './enemies-list.component.html',
  styleUrls: ['./enemies-list.component.scss'],
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, AnotokiDatePipe, RouterLink, ButtonComponent, TextFieldComponent, MultiselectComponent],
})
export class EnemiesListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'enemies';

  filterId = signal('');
  filterName = signal('');
  filterVersions = signal<readonly string[]>([]);

  versionOptions = this.choicesOf('version', compareVersionsDesc);

  sorted = computed(() => [...this.rows()].sort((a, b) => compareVersionsDesc(a.version, b.version) || String(a.name).localeCompare(String(b.name))));

  filtered = computed(() => this.sorted().filter((row) => contains(row.id, this.filterId()) && contains(row.name, this.filterName()) && includedIn(row.version, this.filterVersions())));

  hasActiveFilter = computed(() => !!String(this.filterId() ?? '').trim() || !!String(this.filterName() ?? '').trim() || (this.filterVersions() ?? []).length > 0);

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
