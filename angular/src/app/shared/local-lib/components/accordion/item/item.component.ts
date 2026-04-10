import { Component, model } from '@angular/core';
import { ButtonComponent } from '../../button/button.component';

@Component({
  selector: 'app-accordion-item',
  imports: [ButtonComponent],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
})
export class AccordionItemComponent {
  title = model<string | undefined>(undefined);
  expanded = model<boolean>(false);
  gap = model<boolean>(true);
  lazy = model<boolean>(false);
  class = model<string | undefined>(undefined);

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
