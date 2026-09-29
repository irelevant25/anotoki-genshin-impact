import { CommonModule, DatePipe } from '@angular/common';
import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractRolesComponent } from '../../abstract-roles.class';

type EmitType<T> = T extends any[] ? T[number] : T;

@Component({
  selector: 'app-text-field',
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.scss',
})
export class TextFieldComponent<T = any> extends AbstractRolesComponent {
  label = model<string | undefined>(undefined);
  keyName = model<string | undefined>(undefined);
  value = model<T | undefined>(undefined);
  type = model<'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'array' | 'array-inline'>('text');
  class = model<string | undefined>(undefined);
  prefix = model<string | undefined>(undefined);
  suffix = model<string | undefined>(undefined);
  cols = model<string | undefined>(undefined);
  disableWrapLabel = model<boolean>(false);

  valueClick = output<EmitType<T>>();
  valueClickIsObserved = signal(false);

  Array = Array;

  ngAfterViewInit(): void {
    // TODO: accessing private property - dangerous => waiting for angular to implement 'observed' or 'listeners' public property
    const listeners = this.valueClick['listeners'] ?? [];
    this.valueClickIsObserved.set(listeners.length > 0);
  }

  onValueClick(value?: T): void {
    this.valueClick.emit((value ?? '') as EmitType<T>);
  }
}
