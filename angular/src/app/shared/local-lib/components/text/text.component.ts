import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';

type Type = string | number;

@Component({
  selector: 'app-text',
  imports: [FormsModule],
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: TextComponent,
    },
  ],
})
export class TextComponent extends AbstractInputComponent<Type> {
  maxLength = model<number | undefined>(undefined);
  maxLengthCounter = model<boolean>(true);

  /** 'password' masks what is typed; everything else behaves as before. */
  type = model<'text' | 'password'>('text');

  remainingChars: number = 0;
  remainsWord: string = '';
  charsWord: string = '';

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.inputChange.emit(newValue as Type);
  }

  override afterValueChange(): void {
    this.recalculateRemainingLength();
  }

  recalculateRemainingLength(): void {
    const max = this.maxLength();
    const val = this.computedValue().toString() || '';
    this.remainingChars = max ? max - val.length : 0;

    // remainsWord
    this.remainsWord = this.remainingChars >= 2 && this.remainingChars <= 4 ? 'zostávajú' : 'zostáva';

    // charsWord
    if (this.remainingChars <= 0 || this.remainingChars >= 5) {
      this.charsWord = 'znakov';
    } else if (this.remainingChars === 1) {
      this.charsWord = 'znak';
    } else {
      this.charsWord = 'znaky';
    }
  }
}
