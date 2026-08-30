import { Component, effect, model, ViewChild } from '@angular/core';
import { DataTableData, RowClickEvent, TableComponent, TableEvent } from './components/table/table.component';
import { Observable, takeUntil } from 'rxjs';
import { isNullOrEmpty, removeEmptyPropertiesDeep } from './helper.class';
import { HttpErrorResponse } from '@angular/common/http';
import { FilterComponent } from './components/filter/filter.component';
import { InputValidationComponent } from './abstract-input-validation.class';

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
export abstract class AbstractTableComponent<
  TFilter extends Record<string, any>,
  TTableData extends Record<string, any>,
  TFilterSearch extends Record<string, any> = any,
> extends InputValidationComponent {
  @ViewChild('table') table?: TableComponent<TTableData>;
  @ViewChild('filter') filter?: FilterComponent<TFilter>;

  readonly = model<boolean>(true);

  selectedRows = model<TTableData[]>([]);

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
  requestSearch: TableDataRequest<TFilterSearch> = {
    page: 0,
    limit: 10,
    sort: undefined,
    order: OrderEnum.ASC,
    filter: {},
  };
  searchTimeout: any;
  lastSearchValue?: string | undefined;

  routeIdName: string = 'id';
  get id(): number | string | undefined {
    const id = this.route.snapshot.paramMap.get(this.routeIdName) ?? '';
    if (id === null) {
      console.error(`No id with name ${this.routeIdName} was found in route params`);
      return undefined;
    }
    return id;
  }

  constructor() {
    super();
    let initialRun = true;
    effect(() => {
      const readonly = this.readonly();
      if (initialRun) {
        initialRun = false;
        return;
      }
      if (readonly) {
        this.loadData();
      }
    });
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
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
    this.lastSearchValue = undefined;
    this.requestSearch.filter = {};
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

  protected mapData(data: DataTableData<any>): DataTableData<TTableData> {
    return data;
  }

  async rowClick(rowClickEvent?: RowClickEvent<TTableData>): Promise<void> {
    const detailPageValue = rowClickEvent?.row[this.detailPropertyName];
    if (detailPageValue) {
      await this.router.navigate([detailPageValue], { relativeTo: this.route });
    } else {
      console.error(`Detail page value not found for property ${String(this.detailPropertyName)} on row:`, rowClickEvent?.row);
    }
  }

  protected abstract loadData$(request: TableDataRequest<TFilter>): Observable<any>;

  refresh(): void {
    if (!isNullOrEmpty(this.lastSearchValue)) {
      this.loadDataSearch();
    } else {
      this.loadData();
    }
  }

  onFilter(): void {
    this.markAllAsTouched();
    if (this.isInvalid()) {
      return;
    }
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

      this.requestSearch.page = tableEvent.page.page;
      this.requestSearch.limit = tableEvent.page.pageSize;
      this.requestSearch.order = tableEvent.sort.direction;
      this.requestSearch.sort = tableEvent.sort.column;
    }
    if (tableEvent?.reloadData) {
      this.refresh();
    }
  }

  protected override onModalSuccess(): void {
    this.refresh();
  }

  protected loadDataSearch(requestSearch?: TableDataRequest<TFilterSearch>): void {
    this.request.filter = {};
    this.loading.set(true);
    requestSearch = removeEmptyPropertiesDeep(requestSearch ?? this.requestSearch);
    requestSearch.filter = requestSearch.filter ?? {};
    this.loadDataSearch$(requestSearch)
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

  protected loadDataSearch$(requestSearch?: TableDataRequest<TFilterSearch>): Observable<any> {
    throw new Error('Method not overriden.');
  }

  searchValueChanged(searchValue: string | undefined | null): void {
    if (isNullOrEmpty(searchValue) && isNullOrEmpty(this.lastSearchValue)) {
      return;
    }
    if (this.requestSearch.page) {
      this.requestSearch.page = 1;
      if (this.table) {
        this.table.page.set(this.requestSearch.page);
        this.table.onPageChange(false);
      }
    }
    this.lastSearchValue = JSON.stringify(this.requestSearch.filter);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadDataSearch(this.requestSearch);
    }, 500);
  }
}
