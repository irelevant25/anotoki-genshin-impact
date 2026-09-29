import { Component, ContentChildren, model, OutputRefSubscription, QueryList } from '@angular/core';
import { AccordionItemComponent } from './item/item.component';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-accordion',
  imports: [],
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss',
})
export class AccordionComponent extends AbstractRolesComponent {
  @ContentChildren(AccordionItemComponent, { descendants: true }) items?: QueryList<AccordionItemComponent>;

  class = model<string | undefined>(undefined);
  onlyOneOpen = model<boolean>(true);

  private readonly _subscriptions: OutputRefSubscription[] = [];

  ngAfterViewInit(): void {
    this.items?.forEach((item) => {
      const subscription = item.expanded.subscribe(() => {
        if (this.onlyOneOpen() && item.expanded) {
          this.closeAll();
          item.expanded.set(true);
        }
      });
      this._subscriptions.push(subscription);
    });
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  closeAll(): void {
    this.items?.forEach((item) => item.expanded.set(false));
  }
}
