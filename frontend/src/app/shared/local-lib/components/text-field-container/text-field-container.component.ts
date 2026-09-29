import { Component, model } from '@angular/core';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-text-field-container',
  imports: [],
  templateUrl: './text-field-container.component.html',
  styleUrl: './text-field-container.component.scss',
})
export class TextFieldContainerComponent extends AbstractRolesComponent {
  cols = model<string | number>('3');
  class = model<string>('');
  isGroup = model<boolean>(false);
  groupText = model<string>('');
}
