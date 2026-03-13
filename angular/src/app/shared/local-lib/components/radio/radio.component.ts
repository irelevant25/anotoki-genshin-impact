import { Component, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';

type Orientation = 'horizontal' | 'vertical';

type Type = string | number;

export interface RadioOption {
  key: Type;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-radio',
  imports: [FormsModule],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: RadioComponent,
    },
  ],
})
export class RadioComponent extends AbstractInputComponent<Type> {
  options = model<RadioOption[] | number[] | string[]>([]);
  radioClass = model<string>('');
  orientation = model<Orientation>('vertical');

  computedOptions = computed(() => {
    const raw = this.options();
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((option) => {
      if (typeof option === 'object' && 'key' in option && 'value' in option) {
        return option as RadioOption;
      }
      return { key: option, value: String(option) };
    });
  });

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.inputChange.emit(this.value());
  }

  onRadioBlur(): void {
    // Check if focus is moving to another radio in the same group
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      const isStillInGroup = activeElement && activeElement.getAttribute('id') === this.inputId;

      if (!isStillInGroup) {
        this.isFocused.set(false);
        this.onBlur();
      }
    }, 0);
  }

  isSelected(optionValue: Type): boolean {
    return this.value() === optionValue;
  }

  getRadioId(index: number): string {
    return `${this.inputId}-${index}`;
  }
}
