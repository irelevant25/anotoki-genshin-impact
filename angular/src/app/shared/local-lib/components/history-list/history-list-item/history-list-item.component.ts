import { Component, HostBinding, model, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HistoryListItemConfig } from '../history-list.component';
import { AppDatePipe } from '../../../pipes/date.pipe';

@Component({
  selector: 'app-history-list-item',
  imports: [FormsModule, AppDatePipe],
  templateUrl: './history-list-item.component.html',
  styleUrls: ['./history-list-item.component.scss'],
})
export class HistoryListItemComponent {
  @ViewChild('stepTemplate', { static: true }) template?: TemplateRef<any>;

  item = model<HistoryListItemConfig | null | undefined>(null);
  isLast = model<boolean>(false);

  @HostBinding('class.is-last')
  get isLastClass(): boolean {
    return this.isLast();
  }
}
