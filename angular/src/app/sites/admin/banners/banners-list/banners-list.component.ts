import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { BannerApiService } from '../../../../api';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AdminListComponent, contains, includedIn } from '../../shared/admin-list.class';
import { MaterialIconDirective } from '../../shared/material-icon.directive';

@Component({
  selector: 'app-banners-list',
  templateUrl: './banners-list.component.html',
  styleUrls: ['./banners-list.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TextComponent, MultiselectComponent, MaterialIconDirective],
})
export class BannersListComponent extends AdminListComponent<any> implements OnInit {
  readonly entityLabel = 'banners';

  filterId = signal<string | number | null | undefined>('');
  filterName = signal<string | number | null | undefined>('');
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  versionOptions = this.distinct('version');

  /** Newest run first - that is how banners are looked up in practice. */
  sorted = computed(() => [...this.rows()].sort((a, b) => String(b.duration_from ?? '').localeCompare(String(a.duration_from ?? ''))));

  filtered = computed(() =>
    this.sorted().filter(
      (row) => contains(row.id, this.filterId()) && contains(row.name, this.filterName()) && includedIn(row.version, this.filterVersions())
    )
  );

  hasActiveFilter = computed(
    () => !!String(this.filterId() ?? '').trim() || !!String(this.filterName() ?? '').trim() || (this.filterVersions() ?? []).length > 0
  );

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
  artName(banner: { version: string; name: string }): string {
    return `${banner.version} - ${banner.name}`;
  }

  /** Dates come back as timestamps; the day is all that matters here. */
  day(value: string | null | undefined): string {
    return value ? String(value).substring(0, 10) : '—';
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterVersions.set([]);
  }
}
