import { CommonModule } from '@angular/common';
import { Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractTooltipComponent } from '../../abstract-tooltip.class';
import { isNullOrEmpty } from '../../helper.class';

export type BadgeType =
  | 'main'
  | 'main-light'
  | 'primary'
  | 'primary-light'
  | 'secondary'
  | 'danger'
  | 'danger-light'
  | 'success'
  | 'success-light'
  | 'warning'
  | 'warning-light'
  | 'info'
  | 'dark'
  | 'link'
  | 'none'
  | 'muted'
  | 'disabled';

@Component({
  selector: 'app-badge',
  imports: [CommonModule, FormsModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent extends AbstractTooltipComponent {
  value = model<string[] | number[] | any[] | undefined>(undefined);
  radiusCircle = model<boolean>(false);
  radius = model<string>();
  propertyName = model<string | undefined>(undefined);
  type = model<BadgeType>('main');
  colorText = model<string | undefined>(undefined);
  colorBg = model<string | undefined>(undefined);
  padding = model<'small' | 'base' | 'large'>('base');
  textSize = model<'small' | 'base' | 'large'>('small');
  label = model<string>('');
  class = model<string | undefined>(undefined);
  inputId: string = `input-${Math.random().toString(36).substr(2, 9)}`;

  badgeColor = computed(() => (this.type() === 'none' ? '' : `var(--color-${this.type()}-text)`));
  badgeBackground = computed(() => (this.type() === 'none' ? '' : `var(--color-${this.type()})`));
  badgeClasses = computed(() => `padding-${this.padding()} text-${this.textSize()}`);
  badges = computed<string[] | number[]>(() => {
    const values = this.value()?.filter((x) => !isNullOrEmpty(x));
    const property = this.propertyName();
    if (values && property) {
      const properties = property.split('.');
      return values.map((item) => {
        let propValue: any = item;
        properties.forEach((prop) => (propValue = propValue[prop]));
        return propValue;
      });
    }
    return values ?? [];
  });
}
