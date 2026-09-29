import { Component, ContentChildren, model, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryListItemComponent } from './history-list-item/history-list-item.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';

export interface HistoryListItemConfig {
  author: string;
  timestamp: string;
  message: string;
  messageIcon?: string;
  authorIcon?: string;
  color?: string;
  data?: any;
}

@Component({
  selector: 'app-history-list',
  imports: [CommonModule, FormsModule, HistoryListItemComponent],
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss'],
})
export class HistoryListComponent extends AbstractRolesComponent {
  @ContentChildren(HistoryListItemComponent) itemComponents?: QueryList<HistoryListItemComponent>;

  items = model<HistoryListItemConfig[]>([]);
}
