import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { BannerApiService } from '../../../../api';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { MultiselectComponent } from '@anotoki/lib/ui/multiselect';
import { AdminListComponent, contains, includedIn } from '../../shared/admin-list.class';
import { MaterialIconDirective } from '../../shared/material-icon.directive';
import { AnotokiDatePipe, AnotokiDates } from '@anotoki/lib/ui/dates';

@Component({
  selector: 'app-banners-list',
  templateUrl: './banners-list.component.html',
  styleUrls: ['./banners-list.component.scss'],
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, RouterLink, AnotokiDatePipe, ButtonComponent, TextFieldComponent, MultiselectComponent, MaterialIconDirective],
})
export class BannersListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'banners';

  filterId = signal('');
  filterName = signal('');
  filterVersions = signal<readonly string[]>([]);

  versionOptions = this.choicesOf('version');

  /** Newest run first - that is how banners are looked up in practice. */
  sorted = computed(() => [...this.rows()].sort((a, b) => String(b.duration_from ?? '').localeCompare(String(a.duration_from ?? ''))));

  filtered = computed(() => this.sorted().filter((row) => contains(row.id, this.filterId()) && contains(row.name, this.filterName()) && includedIn(row.version, this.filterVersions())));

  hasActiveFilter = computed(() => !!String(this.filterId() ?? '').trim() || !!String(this.filterName() ?? '').trim() || (this.filterVersions() ?? []).length > 0);

  private readonly _bannerApi = inject(BannerApiService);

  ngOnInit(): void {
    this.load();
  }

  protected fetch(): Observable<any[]> {
    return this._bannerApi.getBanners();
  }

  protected remove(id: number): Observable<unknown> {
    return this._bannerApi.deleteBanner(id);
  }

  /** Banner art has no column; it is named "{version} - {name}". */
  private readonly _dates = inject(AnotokiDates);

  /** Dates come back as timestamps; the day is all that matters here. */
  day(value: string | null | undefined): string {
    return value ? this._dates.format(value, 'numeric') : '—';
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterVersions.set([]);
  }
}
