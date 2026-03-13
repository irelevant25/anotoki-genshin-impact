import { Component, ViewChild, model, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { NumberComponent } from '../number/number.component';
import { thousandSeparator } from '../../helper.class';

export interface ICalculatedPage {
  page: number;
  pageSize: number;
  total: number;
}

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, FormsModule, DropdownComponent, NumberComponent],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  @ViewChild(NumberComponent) pageInput?: NumberComponent;

  page = model<number>(1);
  pageSize = model<number>(10);

  total = input<number>(0);
  pageSizeOptions = input<number[]>([5, 10, 25, 50, 100]);
  class = input<string | undefined>(undefined);

  totalPages = computed(() => {
    const totalValue = this.total();
    const pageSizeValue = this.pageSize();
    return totalValue === 0 ? 1 : Math.ceil(totalValue / pageSizeValue);
  });
  formattedTotal = computed(() => thousandSeparator(this.total()));
  formattedTotalPages = computed(() => thousandSeparator(this.totalPages()));

  goToPage(page: number): void {
    this.page.set(page);
  }

  onBlur(): void {
    this.page.set(this.page() || 1);
  }
}
