import { Component, inject, ViewChild } from '@angular/core';
import { DataTableData, RowClickEvent, TableComponent, TableEvent } from './components/table/table.component';
import { Observable, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { removeEmptyPropertiesDeep } from './helper.class';
import { HttpErrorResponse } from '@angular/common/http';
import { FilterComponent } from './components/filter/filter.component';
import { AbstractModalComponent } from './abstract-modal.class';

export enum OrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface TableDataRequest<T> {
  page: number;
  limit: number;
  sort?: string;
  order?: OrderEnum;
  filter: Partial<T>;
}

@Component({ template: '' })
export abstract class AbstractTableComponent<TFilter extends Record<string, any>, TTableData> extends AbstractModalComponent {
  @ViewChild('table') table?: TableComponent<TTableData>;
  @ViewChild('filter') filter?: FilterComponent<TFilter>;

  detailPropertyName: keyof TTableData = 'id' as keyof TTableData;
  initRequest = true;
  tableData: DataTableData<TTableData> = { result: [], total: 0, poradie: [] };
  request: TableDataRequest<TFilter> = {
    page: 0,
    limit: 10,
    sort: undefined,
    order: OrderEnum.ASC,
    filter: {},
  };

  private readonly _router$ = inject(Router);
  private readonly _route$ = inject(ActivatedRoute);

  ngAfterViewInit(): void {
    this.resetTableData();

    if (!this.filter) {
      // filter is optional
      console.warn('Missing template reference variable "#filter" on html component tag.');
    }
    if (!this.table) {
      // table is required
      throw new Error('Missing template reference variable "#table" on html component tag.');
    } else {
      if (this.table) {
        this.table.page.set(this.request.page);
        this.table.pageSize.set(this.request.limit);
        this.table.onPageChange(false);
        this.table.currentSort.set({
          column: this.request.sort ?? '',
          direction: this.request.order,
        });
      }
    }

    if (this.initRequest) {
      this.initRequest = false;
      this.loadData(this.request);
    }
  }

  override ngOnDestroy(): void {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  resetTableData(): void {
    this.tableData.result = [];
    this.tableData.total = 0;
  }

  protected loadData(request?: TableDataRequest<TFilter>): void {
    this.loading.set(true);
    request = removeEmptyPropertiesDeep(request ?? this.request);
    request.filter = request.filter ?? {};
    this.loadData$(request)
      .pipe(takeUntil(this.unsubscriber))
      .subscribe({
        next: (result) => {
          this.tableData = this.mapData(result);
          this.loading.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.resetTableData();
          this.loading.set(false);
          this.notificationService.showError(`Nastala chyba pri načítaní dat: ${e?.error?.message}`);
        },
      });
  }

  protected mapData(data: DataTableData<TTableData>): DataTableData<TTableData> {
    return data;
  }

  async rowClick(rowClickEvent?: RowClickEvent<TTableData>): Promise<void> {
    const detailPageValue = rowClickEvent?.row[this.detailPropertyName];
    if (detailPageValue) {
      await this._router$.navigate([detailPageValue], { relativeTo: this._route$ });
    }
  }

  protected abstract loadData$(request: TableDataRequest<TFilter>): Observable<any>;

  refresh(): void {
    this.loadData();
  }

  onFilter(): void {
    this.request.page = 0;
    if (this.table) {
      this.table.page.set(this.request.page);
      this.table.onPageChange(false);
    }
    this.loadData(this.request);
  }

  onReset(): void {
    this.request.filter = {};
    this.onFilter();
  }

  onTableChange(tableEvent: TableEvent): void {
    if (tableEvent) {
      this.request.page = tableEvent.page.page;
      this.request.limit = tableEvent.page.pageSize;
      this.request.order = tableEvent.sort.direction;
      this.request.sort = tableEvent.sort.column;
    }
    if (tableEvent?.reloadData) {
      this.refresh();
    }
  }

  protected override onModalSuccess(): void {
    this.refresh();
  }
}
