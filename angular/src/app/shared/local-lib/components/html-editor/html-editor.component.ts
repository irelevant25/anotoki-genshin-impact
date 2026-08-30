import { Component, ElementRef, model, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DropdownOption } from '../../services/options-helper.service';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { normalizeHtml } from '../../helper.class';

type Type = string;

@Component({
  selector: 'app-html-editor',
  imports: [DropdownComponent, ColorPickerComponent, FormsModule],
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
  editorElement = viewChild<ElementRef<HTMLDivElement>>('editorElement');

  minHeight = model<string>('200px');
  selectingFontSize = model<boolean>(false);
  remainingChars: number = 0;
  remainsWord: string = '';
  charsWord: string = '';

  selectingFontFamily = model<boolean>(false);
  selectingForeColor = model<boolean>(false);
  selectingBackColor = model<boolean>(false);

  maxLength = model<number | undefined>(undefined);
  maxLengthCounter = model<boolean>(true);

  showSource = signal<boolean>(false);
  sourceValue = signal<string>('');

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
  private _foreColorValueDefault: string | null = '#000000';
  private _backColorValueDefault: string | null = '#ffffff';

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
    this.editorElement()?.nativeElement.focus();
  }

  private saveSelection(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this._savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  private restoreSelection(): void {
    const el = this.editorElement()?.nativeElement;
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
    this.editorElement()?.nativeElement.focus();
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
    this.foreColor.set(value ?? this.foreColorDefault);
    this.restoreSelection();
    if (value) {
      document.execCommand('foreColor', false, value);
    } else {
      this.removeStyleFromSelection(['color'], ['color']);
      this.commitEditorContent();
    }
    this.saveSelection();
    if (override) {
      this._foreColorValueDefault = value ?? null;
    }
  }

  onForeColorClosed(): void {
    this.restoreSelection();
    if (this._foreColorValueDefault) {
      this.foreColor.set(this._foreColorValueDefault);
      document.execCommand('foreColor', false, this._foreColorValueDefault);
    } else {
      this.foreColor.set(this.foreColorDefault);
      this.removeStyleFromSelection(['color'], ['color']);
      this.commitEditorContent();
    }
    this.saveSelection();
  }

  onBackColorChange(value?: string | null, override?: boolean): void {
    this.backColor.set(value ?? this.backColorDefault);
    this.restoreSelection();
    if (value) {
      document.execCommand('backColor', false, value);
    } else {
      this.removeStyleFromSelection(['background-color', 'background'], ['bgcolor']);
      this.commitEditorContent();
    }
    this.saveSelection();
    if (override) {
      this._backColorValueDefault = value ?? null;
    }
  }

  onBackColorClosed(): void {
    this.restoreSelection();
    if (this._backColorValueDefault) {
      this.backColor.set(this._backColorValueDefault);
      document.execCommand('backColor', false, this._backColorValueDefault);
    } else {
      this.backColor.set(this.backColorDefault);
      this.removeStyleFromSelection(['background-color', 'background'], ['bgcolor']);
      this.commitEditorContent();
    }
    this.saveSelection();
  }

  onEditorInput(event: Event): void {
    const target = event.target as HTMLDivElement;
    this.skipAfterValueChange = true;
    this.value.set(normalizeHtml(target.innerHTML));
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
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.applyIndent(event.shiftKey ? -1 : 1, !event.shiftKey && !this.isInList());
    }
  }

  onIndent(event: Event): void {
    event.preventDefault();
    this.applyIndent(1, false);
    this.editorElement()?.nativeElement.focus();
  }

  onOutdent(event: Event): void {
    event.preventDefault();
    this.applyIndent(-1, false);
    this.editorElement()?.nativeElement.focus();
  }

  private applyIndent(direction: 1 | -1, tabAsCharacter: boolean): void {
    const editorEl = this.editorElement()?.nativeElement;
    if (!editorEl) {
      return;
    }
    if (this.isInList()) {
      document.execCommand(direction === 1 ? 'indent' : 'outdent', false);
      this.commitEditorContent();
      return;
    }
    if (tabAsCharacter) {
      this.insertTabAtCaret();
      return;
    }
    const blocks = this.getSelectionBlocks(editorEl);
    const step = this.getIndentStep();
    for (const block of blocks) {
      const current = parseFloat(block.style.marginLeft) || 0;
      const next = Math.max(0, current + direction * step);
      if (next === 0) {
        block.style.removeProperty('margin-left');
        if (!block.getAttribute('style')) {
          block.removeAttribute('style');
        }
      } else {
        block.style.marginLeft = `${next}px`;
      }
    }
    this.commitEditorContent();
  }

  private getSelectionBlocks(editorEl: HTMLElement): HTMLElement[] {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return [];
    }
    const range = selection.getRangeAt(0);
    const blockTags = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE']);
    const findBlock = (node: Node | null): HTMLElement | null => {
      let current: Node | null = node;
      while (current && current !== editorEl) {
        if (current.nodeType === Node.ELEMENT_NODE && blockTags.has((current as HTMLElement).tagName)) {
          return current as HTMLElement;
        }
        current = current.parentNode;
      }
      return null;
    };
    let startBlock = findBlock(range.startContainer);
    let endBlock = findBlock(range.endContainer);
    if (!startBlock && !endBlock) {
      document.execCommand('formatBlock', false, '<div>');
      startBlock = findBlock(window.getSelection()?.getRangeAt(0).startContainer ?? null);
      endBlock = findBlock(window.getSelection()?.getRangeAt(0).endContainer ?? null);
    }
    if (!startBlock) {
      return endBlock ? [endBlock] : [];
    }
    if (!endBlock || startBlock === endBlock) {
      return [startBlock];
    }
    const all = Array.from(editorEl.querySelectorAll<HTMLElement>('div, p, h1, h2, h3, h4, h5, h6, pre, blockquote'));
    const startIdx = all.indexOf(startBlock);
    const endIdx = all.indexOf(endBlock);
    if (startIdx === -1 || endIdx === -1) {
      return [startBlock, endBlock];
    }
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    return all.slice(from, to + 1);
  }

  private getIndentStep(): number {
    const editorEl = this.editorElement()?.nativeElement;
    if (!editorEl) {
      return 20;
    }
    const raw = getComputedStyle(editorEl).getPropertyValue('--html-editor-indent').trim();
    const px = parseFloat(raw);
    return Number.isFinite(px) && px > 0 ? px : 20;
  }

  private isInList(): boolean {
    const selection = window.getSelection();
    const editorEl = this.editorElement()?.nativeElement;
    if (!selection || selection.rangeCount === 0 || !editorEl) {
      return false;
    }
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node !== editorEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName;
        if (tag === 'LI' || tag === 'UL' || tag === 'OL') {
          return true;
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  private insertTabAtCaret(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const tabNode = document.createTextNode('\t');
    range.insertNode(tabNode);
    range.setStartAfter(tabNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.commitEditorContent();
  }

  override afterValueChange(value?: string | null): void {
    const el = this.editorElement()?.nativeElement;
    if (el && el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? '';
    }
    if (!this.showSource()) {
      this.sourceValue.set(value ?? '');
    }
    this.recalculateRemainingLength();
  }

  toggleSource(event: Event): void {
    event.preventDefault();
    if (this.showSource()) {
      this.showSource.set(false);
    } else {
      this.sourceValue.set(this.value() ?? '');
      this.showSource.set(true);
    }
  }

  onSourceInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.sourceValue.set(target.value);
    this.value.set(target.value);
    this.inputChange.emit(target.value);
  }

  private removeStyleFromSelection(styles: string[], attrs: string[]): void {
    const editorEl = this.editorElement()?.nativeElement;
    if (!editorEl) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      return;
    }

    const targets = new Set<HTMLElement>();

    const collectAncestors = (node: Node): void => {
      let current: Node | null = node;
      while (current && current !== editorEl) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          targets.add(current as HTMLElement);
        }
        current = current.parentNode;
      }
    };
    collectAncestors(range.startContainer);
    collectAncestors(range.endContainer);

    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_ELEMENT);
    let node: Node | null = walker.nextNode();
    while (node) {
      if (range.intersectsNode(node)) {
        targets.add(node as HTMLElement);
      }
      node = walker.nextNode();
    }

    for (const el of targets) {
      for (const s of styles) {
        el.style.removeProperty(s);
      }
      for (const a of attrs) {
        el.removeAttribute(a);
      }
      if (!el.getAttribute('style')) {
        el.removeAttribute('style');
      }
    }
  }

  private commitEditorContent(): void {
    const el = this.editorElement()?.nativeElement;
    if (!el) {
      return;
    }
    this.skipAfterValueChange = true;
    this.value.set(normalizeHtml(el.innerHTML));
    this.inputChange.emit(this.value());
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
