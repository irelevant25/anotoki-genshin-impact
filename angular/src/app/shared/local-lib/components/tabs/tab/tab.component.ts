import { Component, effect, model, output } from '@angular/core';
import { removeDiacritics } from '../../../diacritics';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
})
export class TabComponent {
  title = model<string>();
  visible = model<boolean>(true);
  active = model<boolean>(false);
  icon = model<string>();

  click = output<boolean>();

  constructor() {
    effect(() => {
      const isActive = this.active();
      if (isActive) {
        this.click.emit(isActive);
      }
    });
  }

  get id(): string {
    return `tab-${removeDiacritics(this.title()?.replaceAll(' ', ''))}`;
  }
}
