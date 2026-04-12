import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { AutoResizeDirective } from '../../auto-resize.directive';

type Type = string | number;

@Component({
  selector: 'app-textarea',
  imports: [FormsModule, AutoResizeDirective],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: TextareaComponent,
    },
  ],
})
export class TextareaComponent extends AbstractInputComponent<Type> {
  rows = model<number>(7);
  dynamicRows = model<boolean>(false);
  maxLength = model<number | undefined>(undefined);
  maxLengthCounter = model<boolean>(true);
  height = model<string>('auto');
  resize = model<boolean>(true);

  remainingChars: number = 0;
  remainsWord: string = '';
  charsWord: string = '';

  private _resizeObserver?: ResizeObserver;

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.initMinHeight();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._resizeObserver?.disconnect();
  }

  private initMinHeight(): void {
    const element = this.inputElement?.nativeElement;
    if (!element) {
      return;
    }

    if (element.offsetHeight > 0) {
      element.style.minHeight = `${element.offsetHeight}px`;
      return;
    }

    // Element is hidden (e.g. inside a stepper), wait until it has dimensions
    this._resizeObserver = new ResizeObserver(() => {
      if (element.offsetHeight > 0) {
        element.style.minHeight = `${element.offsetHeight}px`;
        this._resizeObserver?.disconnect();
        this._resizeObserver = undefined;
      }
    });

    this._resizeObserver.observe(element);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.inputChange.emit(this.value());
  }

  override afterValueChange(): void {
    this.recalculateRemainingLength();
  }

  recalculateRemainingLength(): void {
    const max = this.maxLength();
    const val = this.value()?.toString() || '';
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
