import { Component, ViewChild, ElementRef, model, signal } from '@angular/core';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DropdownOption } from '../../services/options-helper.service';
import { ColorPickerComponent } from '../color-picker/color-picker.component';

type Type = string;

@Component({
  selector: 'app-html-editor',
  imports: [DropdownComponent, ColorPickerComponent],
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.scss'],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: HtmlEditorComponent,
    },
  ],
})
export class HtmlEditorComponent extends AbstractInputComponent<Type> {
  @ViewChild('editorElement') editorElement?: ElementRef<HTMLDivElement>;

  minHeight = model<string>('200px');
  selectingFontSize = model<boolean>(false);
  selectingFontFamily = model<boolean>(false);
  selectingForeColor = model<boolean>(false);
  selectingBackColor = model<boolean>(false);

  isFocusedEditor = signal<boolean>(false);
  fontSizeValue = signal<string>('3');
  fontFamilyValue = signal<string>('Arial');
  foreColor = signal<string>('#000000');
  backColor = signal<string>('#ffffff');

  readonly foreColorDefault = '#000000';
  readonly backColorDefault = '#ffffff';

  private _savedRange: Range | null = null;
  private _fontSizeValueDefault: string = '3';
  private _fontFamilyValueDefault: string = 'Arial';
  private _foreColorValueDefault: string = '#000000';
  private _backColorValueDefault: string = '#ffffff';

  readonly fontSizeOptions: DropdownOption[] = [
    { key: '1', value: 'Veľmi malý' },
    { key: '2', value: 'Malý' },
    { key: '3', value: 'Normálny' },
    { key: '4', value: 'Veľký' },
    { key: '5', value: 'Veľmi veľký' },
    { key: '6', value: 'Obrovský' },
    { key: '7', value: 'Maximálny' },
  ];

  readonly fontFamilyOptions: DropdownOption[] = [
    { key: 'Arial', value: 'Arial' },
    { key: 'Times New Roman', value: 'Times New Roman' },
    { key: 'Courier New', value: 'Courier New' },
  ];

  execCommand(event: Event | undefined, command: string, value?: string): void {
    event?.preventDefault();
    document.execCommand(command, false, value);
    this.editorElement?.nativeElement.focus();
  }

  private saveSelection(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this._savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  private restoreSelection(): void {
    const el = this.editorElement?.nativeElement;
    if (!el) {
      return;
    }
    el.focus();
    const selection = window.getSelection();
    if (selection && this._savedRange) {
      selection.removeAllRanges();
      selection.addRange(this._savedRange);
    }
  }

  onInsertLink(event: Event): void {
    event.preventDefault();
    this.restoreSelection();
    const url = prompt('Zadajte URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
    this.editorElement?.nativeElement.focus();
  }

  onFontSizeChange(option?: DropdownOption, override?: boolean): void {
    const v = option?.key.toString();
    if (v) {
      this.fontSizeValue.set(v);
      this.restoreSelection();
      document.execCommand('fontSize', false, v);
      this.saveSelection();
      if (override) {
        this._fontSizeValueDefault = v;
      }
    }
  }

  onFontSizeClosed(): void {
    this.restoreSelection();
    this.fontSizeValue.set(this._fontSizeValueDefault);
    document.execCommand('fontSize', false, this._fontSizeValueDefault);
    this.saveSelection();
  }

  onFontFamilyChange(option?: DropdownOption, override?: boolean): void {
    const v = option?.key.toString();
    if (v) {
      this.fontFamilyValue.set(v);
      this.restoreSelection();
      document.execCommand('fontName', false, v);
      this.saveSelection();
      if (override) {
        this._fontFamilyValueDefault = v;
      }
    }
  }

  onFontFamilyClosed(): void {
    this.restoreSelection();
    this.fontFamilyValue.set(this._fontFamilyValueDefault);
    document.execCommand('fontName', false, this._fontFamilyValueDefault);
    this.saveSelection();
  }

  onForeColorChange(value?: string | null, override?: boolean): void {
    if (!value) {
      return;
    }
    this.foreColor.set(value);
    this.restoreSelection();
    document.execCommand('foreColor', false, value);
    this.saveSelection();
    if (override) {
      this._foreColorValueDefault = value;
    }
  }

  onForeColorClosed(): void {
    this.restoreSelection();
    this.foreColor.set(this._foreColorValueDefault);
    document.execCommand('foreColor', false, this._foreColorValueDefault);
    this.saveSelection();
  }

  onBackColorChange(value?: string | null, override?: boolean): void {
    if (!value) {
      return;
    }
    this.backColor.set(value);
    this.restoreSelection();
    document.execCommand('backColor', false, value);
    this.saveSelection();
    if (override) {
      this._backColorValueDefault = value;
    }
  }

  onBackColorClosed(): void {
    this.restoreSelection();
    this.backColor.set(this._backColorValueDefault);
    document.execCommand('backColor', false, this._backColorValueDefault);
    this.saveSelection();
  }

  onEditorInput(event: Event): void {
    const target = event.target as HTMLDivElement;
    this.value.set(target.innerHTML);
    this.inputChange.emit(this.value());
  }

  onEditorFocus(): void {
    this.isFocusedEditor.set(true);
    this.isFocused.set(true);
    this.focusChange.emit(true);
  }

  onEditorBlur(): void {
    this.saveSelection();
    this.isFocusedEditor.set(false);
    this.onBlur();
  }

  onEditorKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          this.execCommand(event, 'bold');
          break;
        case 'i':
          event.preventDefault();
          this.execCommand(event, 'italic');
          break;
        case 'u':
          event.preventDefault();
          this.execCommand(event, 'underline');
          break;
      }
    }
  }

  override afterValueChange(value?: string | null): void {
    const el = this.editorElement?.nativeElement;
    if (el && el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? '';
    }
  }
}
