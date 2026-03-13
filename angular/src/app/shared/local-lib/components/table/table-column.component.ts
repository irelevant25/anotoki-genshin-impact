import { Component, TemplateRef, ContentChild, PipeTransform, model, effect } from '@angular/core';

// Example of custom column template
// <app-table-column key="stavPohladavky" label="Stav pohľadávky" [sortable]="true">
//   <ng-template let-row let-value="value">
//     <span [class]="getStatusClass(value)">
//       {{ value }}
//     </span>
//   </ng-template>
// </app-table-column>

export type DeepKeys<T> = T extends Record<string, any> ? keyof T | { [K in keyof T]: DeepKeys<T[K]> extends infer U ? (U extends string ? `${string & K}.${U}` : never) : never }[keyof T] : never;
export type ColumnType = 'text' | 'number' | 'date' | 'time' | 'timeWithSeconds' | 'timeText' | 'timeTextWithSeconds' | 'datetime' | 'datetimeWithSeconds' | 'boolean' | 'action';

@Component({
  selector: 'app-table-column',
  template: '',
})
export class TableColumnComponent<T> {
  key = model<DeepKeys<T> | undefined>(undefined);
  label = model<string | undefined>(undefined);
  sortable = model<boolean>(false);
  width = model<string | undefined>(undefined);
  minWidth = model<string | undefined>(undefined);
  maxWidth = model<string | undefined>(undefined);
  type = model<ColumnType>('text');
  decimalPlaces = model<number | undefined>(undefined);
  class = model<string | undefined>(undefined);
  prefix = model<string | undefined>(undefined);
  suffix = model<string | undefined>(undefined);
  sortField = model<string | undefined>(undefined);
  pipe = model<PipeTransform | undefined>(undefined);
  noWrap = model<boolean | undefined>(undefined);

  // Allow custom template to be projected
  @ContentChild(TemplateRef) template?: TemplateRef<any>;

  constructor() {
    effect(() => {
      this.noWrap();
      this.noWrapProcess();
    });
  }

  ngOnInit(): void {
    this.noWrapProcess();
    if (this.width() === undefined && this.type() === 'action') {
      this.width.set('1px');
    }
  }

  noWrapProcess(): void {
    const noWrap = this.noWrap();
    if (noWrap === undefined) {
      this.noWrap.set(this.type() === 'time' || this.type() === 'timeWithSeconds' || this.type() === 'timeText' || this.type() === 'timeTextWithSeconds');
    }
  }
}
