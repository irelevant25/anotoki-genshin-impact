import { Component, model, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractTooltipComponent } from '../../abstract-tooltip.class';
import { ActivatedRoute, Router } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
export type ButtonSize = 'very-small' | 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent extends AbstractTooltipComponent {
  text = model<string>('');
  type = model<'button' | 'submit' | 'reset'>('button');
  variant = model<ButtonVariant | undefined>('primary');
  size = model<ButtonSize>('medium');
  disabled = model<boolean>(false);
  loading = model<boolean>(false);
  icon = model<string>('');
  buttonClass = model<string>('');
  class = model<string | undefined>(undefined);
  outline = model<boolean>(false);
  stopPropagation = model<boolean>(false);
  isBack = model<boolean>(false);

  // Output
  @Output() click = new EventEmitter<Event>();
  @Output() buttonClick = new EventEmitter<Event>();

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
  ) {
    super();
  }

  onClick(event: Event): void {
    if (this.stopPropagation()) {
      event.stopPropagation();
    }
    if (this.disabled()) {
      return;
    }
    if (!this.loading()) {
      this.click.emit(event);
      this.buttonClick.emit(event);
    }
    if (this.isBack()) {
      this._router.navigate(['../'], { relativeTo: this._route });
    }
  }
}
