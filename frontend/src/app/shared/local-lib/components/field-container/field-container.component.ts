import { Component, model } from '@angular/core';
import { AbstractRolesComponent } from '../../abstract-roles.class';

@Component({
  selector: 'app-field-container',
  imports: [],
  templateUrl: './field-container.component.html',
  styleUrl: './field-container.component.scss',
})
export class FieldContainerComponent extends AbstractRolesComponent {
  cols = model<string | number>('3');
  class = model<string>('');
  isGroup = model<boolean>(false);
  groupText = model<string>('');
}
