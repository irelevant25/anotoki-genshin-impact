import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption, Roles } from '../../../shared/local-lib/services/options-helper.service';
import { RoleService } from '../../../shared/local-lib/services/role.service';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';
import { ErrorLogEntry, ErrorLogGroup, ErrorLogReport, LookupApiService } from '../../../api';
import { ClearErrorsComponent } from './clear-errors/clear-errors.component';

/** One column of the chart: a day, and how tall each of its two parts is. */
interface DayBar {
  day: string;
  label: string;
  errors: number;
  warnings: number;
  errorHeight: number;
  warningHeight: number;
  total: number;
}

/**
 * What has been going wrong, read from the files under php/storage/logs.
 *
 * The log holds one line per failure and repeats are common - a broken call
 * from the site fires on every page load - so nothing here lists occurrences
 * one by one. Failures arrive already grouped by fingerprint, loudest first,
 * and a row opens to show the most recent occurrence in full. The count is the
 * number worth reading; the trace is what you open the row for.
 */
@Component({
  selector: 'app-errors',
  templateUrl: './errors.component.html',
  styleUrls: ['./errors.component.scss'],
  imports: [AppDatePipe, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent],
})
export class ErrorsComponent extends AbstractModalComponent implements OnInit {
  readonly report = signal<ErrorLogReport | null>(null);
  // `loading` is inherited from AbstractModalComponent.

  readonly filterDays = signal<string | number | boolean | null | undefined>(7);
  readonly filterLevel = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterStatus = signal<string | number | boolean | null | undefined>(undefined);
  readonly filterSearch = signal<string | number | null | undefined>('');

  /** Which failure is open, by fingerprint. */
  readonly expanded = signal<string | undefined>(undefined);

  /** Every occurrence of the open failure, once it has been asked for. */
  readonly occurrences = signal<ErrorLogEntry[]>([]);
  readonly loadingOccurrences = signal(false);

  readonly dayOptions: DropdownOption[] = [
    { key: 1, value: 'Today' },
    { key: 7, value: 'Last 7 days' },
    { key: 14, value: 'Last 14 days' },
    { key: 30, value: 'Last 30 days' },
  ];

  readonly levelOptions: DropdownOption[] = [
    { key: 'error', value: 'Errors (5xx)' },
    { key: 'warning', value: 'Warnings (4xx)' },
  ];

  readonly groups = computed(() => this.report()?.groups ?? []);

  readonly hasActiveFilter = computed(
    () => !!this.filterLevel() || !!this.filterStatus() || !!String(this.filterSearch() ?? '').trim() || this.filterDays() !== 7
  );

  /**
   * The chart, in the units the template can draw with.
   *
   * Heights are a percentage of the busiest day rather than of a fixed ceiling,
   * so a quiet week still reads as a shape instead of a flat line.
   */
  readonly bars = computed<DayBar[]>(() => {
    const daily = this.report()?.daily ?? [];
    const peak = Math.max(1, ...daily.map((day) => day.errors + day.warnings));

    return daily.map((day) => ({
      day: day.key,
      label: day.key.slice(5),
      errors: day.errors,
      warnings: day.warnings,
      errorHeight: (day.errors / peak) * 100,
      warningHeight: (day.warnings / peak) * 100,
      total: day.errors + day.warnings,
    }));
  });

  /** True when the log has never been written to, which is the good case. */
  readonly isEmpty = computed(() => !!this.report() && !this.report()!.total && !this.hasActiveFilter());

  readonly canClear = inject(RoleService).hasRole(Roles.ADMIN);

  private readonly _lookupApi = inject(LookupApiService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.expanded.set(undefined);

    this._lookupApi
      .getErrors({
        days: Number(this.filterDays() ?? 7),
        level: this._asString(this.filterLevel()),
        status: this.filterStatus() ? Number(this.filterStatus()) : undefined,
        search: String(this.filterSearch() ?? '').trim() || undefined,
      })
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.notificationService.showError(
            e?.status === 403 ? 'The error log is visible to admins and editors only.' : 'Could not read the error log'
          );
        },
      });
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.filterDays.set(7);
    this.filterLevel.set(undefined);
    this.filterStatus.set(undefined);
    this.filterSearch.set('');
    this.load();
  }

  /** Clicking a status chip narrows to it, or widens again if it was already on. */
  toggleStatus(status: string): void {
    this.filterStatus.set(String(this.filterStatus() ?? '') === status ? undefined : status);
    this.load();
  }

  toggle(group: ErrorLogGroup): void {
    const opening = this.expanded() !== group.fingerprint;
    this.expanded.set(opening ? group.fingerprint : undefined);
    this.occurrences.set([]);

    // A group already carries its most recent occurrence, which is what the
    // panel shows. The full list is a second request, made only if asked for.
    if (!opening) {
      this.loadingOccurrences.set(false);
    }
  }

  showOccurrences(group: ErrorLogGroup): void {
    this.loadingOccurrences.set(true);
    this._lookupApi.getError(group.fingerprint, { days: Number(this.filterDays() ?? 7) }).subscribe({
      next: (entries) => {
        this.occurrences.set(entries);
        this.loadingOccurrences.set(false);
      },
      error: () => {
        this.loadingOccurrences.set(false);
        this.notificationService.showError('Could not read that failure in full');
      },
    });
  }

  clearLog(): void {
    this.openModal<ClearErrorsComponent>(ClearErrorsComponent, { size: '1' }, () => this.load());
  }

  /**
   * Where a failure is worth pointing at.
   *
   * A route that does not exist is thrown from inside Slim's own routing
   * middleware, and saying so helps nobody - what was asked for is the useful
   * fact. So a frame inside `vendor/` is not a location at all, and the caller
   * falls back to the request path.
   */
  shortFile(file: string): string {
    if (!file) {
      return '';
    }
    const normalised = file.replace(/\\/g, '/');
    if (normalised.includes('vendor/')) {
      return '';
    }
    const marker = normalised.lastIndexOf('/php/');
    return marker === -1 ? normalised : normalised.slice(marker + 5);
  }

  /** `Slim\Exception\HttpNotFoundException` is one useful word and a lot of namespace. */
  shortType(type: string): string {
    return type.split('\\').pop() ?? type;
  }

  private _asString(value: string | number | boolean | null | undefined): string | undefined {
    return value === null || value === undefined || value === '' ? undefined : String(value);
  }
}
