import { Component, ContentChildren, QueryList, inject, LOCALE_ID, model, effect, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { PaginationComponent } from '../pagination/pagination.component';
import { LoaderComponent } from '../loader/loader.component';
import { OrderEnum } from '../../abstract-table.class';
import { TableColumnComponent } from './table-column.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { copyObject, getValueByKey } from '../../helper.class';
import { ButtonComponent } from '../button/button.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';
import { SlovakDatePipe } from '../../pipes/date.pipe';

export interface SortEvent {
  column: string;
  direction?: OrderEnum;
}

export interface PageEvent {
  page: number;
  pageSize: number;
}

export interface TableEvent {
  sort: SortEvent;
  page: PageEvent;
  reloadData: boolean;
}

export interface DataTableData<T> {
  result: T[];
  total: number;
  poradie: string[];
}

export interface RowClickEvent<T> {
  row: T;
  index: number;
}

export type PaginationType = 'top' | 'bottom' | 'both';

@Component({
  selector: 'app-table',
  imports: [CommonModule, PaginationComponent, LoaderComponent, CheckboxComponent, ButtonComponent],
  providers: [SlovakDatePipe],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent<T> extends AbstractRolesComponent {
  @ContentChildren(TableColumnComponent) columnComponents?: QueryList<TableColumnComponent<T>>;

  data = model<DataTableData<T>>({ result: [], total: 0, poradie: [] });
  loading = model<boolean>(false);
  noDataMessage = model<string>('Žiadne dáta na zobrazenie');
  showPagination = model<boolean>(true);
  paginationType = model<PaginationType>('both');
  page = model<number>(1);
  pageSize = model<number>(10);
  pageSizeOptions = model<number[]>([5, 10, 25, 50, 100]);
  wrapColNames = model<boolean>(true);
  columnReorderable = model<boolean>(false);
  currentSort = model<SortEvent>({ column: '', direction: undefined });
  selectable = model<boolean>(false);
  selectableMultiple = model<boolean>(false);
  selectedRows = model<T[]>([]);
  selectedRowsKey = computed(() => this.selectedRows().map((row) => getValueByKey(row, this.selectedPropertyKey())));
  selectedPropertyKey = model<string>('id');
  selectAllState = computed<boolean>(() => this.data().result.every((r) => this.selectedRowsKey().includes(getValueByKey(r, this.selectedPropertyKey()))));

  rowClass = input<((row: T) => string) | undefined>();

  columnOrderChange = output<string[]>();
  rowClick = output<RowClickEvent<T>>();
  onRequest = output<TableEvent>();

  OrderEnum = OrderEnum;
  getValueByKey = getValueByKey;

  // Internal columns array that combines both input columns and content children
  internalColumns = model<TableColumnComponent<T>[]>([]);

  // Drag and drop state
  resetable: boolean = false;
  columnOrderOriginal: string[] = [];
  columnOrderDefault: TableColumnComponent<T>[] = [];
  draggedColumnIndex: number | null = null;
  dragOverColumnIndex: number | null = null;

  private readonly _locale = inject(LOCALE_ID);
  private _unsubscriber = new Subject<void>();
  private _lastPage: number = NaN;
  private _lastPageSize: number = NaN;

  constructor(private readonly _slovakDatePipe: SlovakDatePipe) {
    super();
    effect(() => {
      this.data();
      this.setupColumns();
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  ngAfterViewInit(): void {
    this.setupColumns();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  setupColumns(): void {
    const allColumns = this.columnComponents?.map((col) => col) ?? [];
    if (this.columnOrderDefault.length === 0) {
      this.columnOrderDefault = this.columnComponents?.filter((x) => x.key) ?? [];
    }

    if (this.data().poradie?.length > 0) {
      // Reorder columns based on columnOrder array
      this.internalColumns.set(this.reorderColumnsByKeys(allColumns, this.data().poradie) ?? []);
    } else {
      // Use default order and initialize columnOrder array
      this.internalColumns.set(allColumns);
      if (allColumns.length > 0) {
        Object.assign(
          this.data().poradie ?? [],
          allColumns.filter((x) => x.key).map((col) => col.key),
        );
      }
    }

    this.resetable = !this.data().poradie?.isEqual(this.columnOrderDefault.map((col) => col.key?.toString() ?? ''));
  }

  private reorderColumnsByKeys(columns: TableColumnComponent<T>[], orderedKeys: string[]): TableColumnComponent<T>[] {
    const reorderedColumns: TableColumnComponent<T>[] = [];
    const remainingColumns = [...columns];

    // Add columns in the specified order
    orderedKeys.forEach((key) => {
      const columnIndex = remainingColumns.findIndex((col) => col.key() === key);
      if (columnIndex !== -1) {
        reorderedColumns.push(remainingColumns.splice(columnIndex, 1)[0]);
      }
    });

    // Add any remaining columns that weren't in the order array
    reorderedColumns.push(...remainingColumns);

    return reorderedColumns;
  }

  onSort(column: TableColumnComponent<T>, event?: Event): void {
    if (!column.sortable) {
      return;
    }

    // Prevent sorting when dragging
    if (this.columnReorderable() && event && (event as any).dataTransfer) {
      return;
    }

    if (this.currentSort().column === (column.sortField() ?? column.key())) {
      // Toggle direction
      if (this.currentSort().direction === OrderEnum.ASC) {
        this.currentSort().direction = OrderEnum.DESC;
      } else if (this.currentSort().direction === OrderEnum.DESC) {
        this.currentSort().direction = undefined;
        this.currentSort().column = '';
      } else {
        this.currentSort().direction = OrderEnum.ASC;
      }
    } else {
      // New column
      this.currentSort().column = column.sortField() ?? column.key()?.toString() ?? '';
      this.currentSort().direction = OrderEnum.ASC;
    }

    this.currentSort.set(this.currentSort());
    this.onRequestData();
  }

  onDragStart(event: DragEvent, index: number): void {
    if (!this.columnReorderable()) {
      return;
    }

    this.columnOrderOriginal = copyObject(this.data().poradie);

    this.draggedColumnIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    if (!this.columnReorderable() || this.draggedColumnIndex === null) {
      return;
    }

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverColumnIndex = index;
  }

  onDragEnter(event: DragEvent, index: number): void {
    if (!this.columnReorderable() || this.draggedColumnIndex === null) {
      return;
    }

    event.preventDefault();
    this.dragOverColumnIndex = index;
  }

  onDragLeave(event: DragEvent): void {
    if (!this.columnReorderable()) {
      return;
    }

    // Only clear dragOverColumnIndex if we're actually leaving the element
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragOverColumnIndex = null;
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    if (!this.columnReorderable() || this.draggedColumnIndex === null) {
      return;
    }

    event.preventDefault();

    const fromIndex = this.draggedColumnIndex;
    const toIndex = dropIndex;

    if (fromIndex !== toIndex) {
      // Reorder the columns array
      const newColumns = [...this.internalColumns()];
      const draggedColumn = newColumns.splice(fromIndex, 1)[0];
      newColumns.splice(toIndex, 0, draggedColumn);

      this.internalColumns.set(newColumns);

      // Update the columnOrder array
      const newColumnOrder = newColumns.filter((x) => x.key).map((col) => col.key?.toString() ?? '');
      this.data().poradie = newColumnOrder satisfies string[];
    }

    // Reset drag state
    this.draggedColumnIndex = null;
    this.dragOverColumnIndex = null;
  }

  resetColumnOrder(): void {
    if (this.columnOrderDefault.length > 0 && !this.data().poradie.isEqual(this.columnOrderDefault.map((col) => col.key?.toString() ?? ''))) {
      this.data().poradie = copyObject(this.columnOrderDefault.map((col) => col.key?.toString() ?? ''));
      this.setupColumns();
      this.columnOrderChange.emit(this.data().poradie);
    }
  }

  onDragEnd(): void {
    // Reset drag state
    this.draggedColumnIndex = null;
    this.dragOverColumnIndex = null;
    if (!this.data().poradie.isEqual(this.columnOrderOriginal)) {
      this.columnOrderChange.emit(this.data().poradie);
      this.setupColumns();
    }
  }

  // Helper methods for drag and drop styling
  getHeaderClass(index: number): string {
    const classes = ['table-header'];

    if (this.columnReorderable()) {
      classes.push('draggable-header');

      if (this.draggedColumnIndex === index) {
        classes.push('dragging');
      }

      if (this.dragOverColumnIndex === index && this.draggedColumnIndex !== index) {
        classes.push('drag-over');
      }
    }

    return classes.join(' ');
  }

  onRequestData(reloadData: boolean = true): void {
    this.onRequest.emit(this.getTableEvent(reloadData));
  }

  getTableEvent(reloadData: boolean = true): TableEvent {
    return {
      sort: {
        column: this.currentSort().column,
        direction: this.currentSort().direction,
      },
      page: {
        page: this.page(),
        pageSize: this.pageSize(),
      },
      reloadData,
    };
  }

  onPageChange(emitEvent: boolean = true): void {
    if (this.page() === null || Number.isNaN(this.page()) || this.page() === undefined || this.page() === this._lastPage) {
      return;
    }
    this._lastPage = this.page();
    if (emitEvent) {
      this.onRequestData();
    }
  }

  onPageSizeChange(): void {
    if (this.pageSize() === this._lastPageSize) {
      return;
    }
    this._lastPageSize = this.pageSize();
    this.page.set(1);
    this._lastPage = this.page();
    this.onRequestData();
  }

  onRowClick(row: T, index: number, column: TableColumnComponent<T>): void {
    if (column.type() === 'action') {
      return;
    }
    this.rowClick.emit({ row, index });
  }

  onSelectionChange(row: T): void {
    const isSelected = this.selectedRows().includes(row);
    let selectedRows: T[];
    if (isSelected) {
      selectedRows = this.selectedRows().filter((r) => getValueByKey(r, this.selectedPropertyKey()) !== getValueByKey(row, this.selectedPropertyKey()));
    } else if (!this.selectableMultiple()) {
      selectedRows = [row];
    } else {
      selectedRows = [...this.selectedRows(), row];
    }
    this.selectedRows.set(selectedRows);
  }

  onSelectAllChange(checked?: boolean | null): void {
    if (!checked) {
      this.selectedRows.set([]);
    } else {
      const current = this.selectedRows();
      const toAdd = this.data().result.filter((row) => !current.includes(row));
      this.selectedRows.set([...current, ...toAdd]);
    }
  }

  getCellValue(row: T, key?: string | number | symbol | undefined): any {
    return getValueByKey(row, key);
  }

  formatCellValue(value: any, column: TableColumnComponent<T>): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (column.pipe()) {
      return column.pipe()?.transform(value);
    }
    switch (column.type()) {
      case 'boolean':
        return value ? 'Áno' : 'Nie';
      case 'date':
        try {
          return this._slovakDatePipe.transform(value as string, 'date') ?? '';
        } catch {
          return value;
        }
      case 'datetime':
        try {
          return this._slovakDatePipe.transform(value as string, 'datetime') ?? '';
        } catch {
          return value;
        }
      case 'datetimeWithSeconds':
        try {
          return this._slovakDatePipe.transform(value as string, 'datetimeWithSeconds') ?? '';
        } catch {
          return value;
        }
      case 'time':
        return this.getTime(value, false, false);
      case 'timeWithSeconds':
        return this.getTime(value, true, false);
      case 'timeText':
        return this.getTime(value, false, true);
      case 'timeTextWithSeconds':
        return this.getTime(value, true, true);
      case 'number':
        const number = Number(value);
        return Number.isNaN(number) ? value : number.toLocaleString(this._locale, { minimumFractionDigits: column.decimalPlaces(), maximumFractionDigits: column.decimalPlaces() });
      default:
        return value;
    }
  }

  getTime(value: number | string, withSeconds: boolean, withText: boolean = false): string {
    let numValue;

    numValue = Number(value);

    if (isNaN(numValue)) {
      if (withSeconds) {
        return withText ? '00h 00m 00s' : '00:00:00';
      }
      return withText ? '00h 00m' : '00:00';
    }

    const isNegative = numValue < 0;
    if (numValue < 0) {
      numValue = Math.abs(numValue);
    }

    const hours = Math.floor(numValue / 3600);
    const minutes = Math.floor((numValue % 3600) / 60);
    const seconds = Math.floor(numValue % 60);

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${isNegative ? '-' : ''}${formattedHours}${withText ? 'h ' : ':'}${formattedMinutes}${withText ? 'm' : ''}${withSeconds ? `${withText ? ' ' : ':'}${formattedSeconds}${withText ? 's' : ''}` : ''}`;
  }

  getCellClass(column: TableColumnComponent<T>, row: any): string {
    const classes = ['table-cell'];
    if (column.class) {
      classes.push(column.class() ?? '');
    }
    return classes.join(' ');
  }
}
