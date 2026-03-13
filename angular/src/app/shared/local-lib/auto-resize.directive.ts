import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: 'textarea[autoResize]',
})
export class AutoResizeDirective {
  @Output() heightChange = new EventEmitter<number>();

  private _value: string = '';
  @Input() set textareaValue(value: any) {
    if (this._value !== value) {
      this._value = value;
      this.resize();
    }
  }

  get value(): string {
    return this._value;
  }

  @Input() dynamicRows: boolean = false;

  constructor(private _elementRef: ElementRef) {}

  @HostListener(':input')
  @HostListener('window:resize')
  onInput(): void {
    requestAnimationFrame(() => this.resize());
  }

  ngOnInit(): void {
    setTimeout(() => this.resize(), 0);
  }

  resize(): void {
    if (!this.dynamicRows) {
      return;
    }
    const textarea = this._elementRef.nativeElement as HTMLTextAreaElement;

    if (!textarea.style.minHeight) {
      return;
    }

    textarea.style.overflow = 'hidden';
    textarea.style.height = '0px';

    textarea.style.height = `${textarea.scrollHeight}px`;
    this.heightChange.emit(textarea.scrollHeight);
  }
}
