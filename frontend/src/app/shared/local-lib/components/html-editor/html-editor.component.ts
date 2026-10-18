import { Component, ElementRef, computed, inject, model, signal, viewChild } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ColorFieldComponent, ColorSwatch } from '@anotoki/lib/ui/color-field';
import { AnotokiDialog } from '@anotoki/lib/ui/dialog';
import { MenuComponent, MenuItemComponent, MenuTriggerDirective } from '@anotoki/lib/ui/menu';
import { RichTextEditableDirective, RichTextToolbarComponent, TextCommand, ToolbarItemDirective, ToolbarTool } from '@anotoki/lib/ui/rich-text';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { AbstractInputComponent } from '../../abstract-input.class';
import { DropdownOption } from '../../services/options-helper.service';
import { RichTextComponent } from '../rich-text/rich-text.component';
import { normalizeHtml } from '../../helper.class';
import { sanitizeRichHtml } from '../../rich-html';
import { HtmlEditorLinkData, HtmlEditorLinkDialogComponent, HtmlEditorLinkResult } from './link-dialog/html-editor-link-dialog.component';

type Type = string;

/** Which colour the panel under the toolbar is choosing: the words' own, or the ground behind them. */
type ColourMode = 'fore' | 'back';

/**
 * The admin panel's editor of markup - a voice-over's line, a guide's page.
 *
 * Its buttons are the anotoki kit's (@anotoki/lib/ui/rich-text, anotoki-lib
 * 0.6): `<anotoki-rich-text-toolbar>` (the ARIA toolbar pattern: one Tab stop,
 * the arrow keys between its items, a format that is on said and drawn) over
 * a contenteditable carrying the kit's `[anotokiRichTextEditable]`, which does
 * the browser's own editing with the focus and the selection put back first.
 * What the kit has no button for is this editor's, in the toolbar's row as
 * its items (`anotokiToolbarItem`): the size and the font (the kit's menus,
 * shown on the text while pointed at), the colours (the kit's colour field in
 * a panel under the toolbar), the HTML source and the preview. A link's
 * address is asked in a dialog of its own (never prompt()) and set through the
 * kit's `link()`, which takes a web, mail or this site's own address and
 * nothing else.
 *
 * The kit lets no markup in from outside: a paste or a drop that brings HTML
 * (a web page's, a word processor's) comes in as its plain text, and the
 * formatting is the toolbar's to give. What the editor holds is still
 * markup a person made - typed in the HTML source, or sent to the API by
 * anybody who may edit - and the server keeps it as it was written (no
 * allow-list there: api/guides.php, the voice-overs' text columns). So the
 * page's allow-list (`sanitizeRichHtml`, rich-html.ts) stands wherever stored
 * markup reaches a live page: the site and the preview (app-rich-text), and
 * this editor itself as it loads a stored text (afterValueChange) - an
 * `<img onerror>` an EDITOR saved never runs in an ADMIN's browser.
 */
@Component({
  selector: 'app-html-editor',
  imports: [
    ButtonComponent,
    ColorFieldComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    RichTextComponent,
    RichTextEditableDirective,
    RichTextToolbarComponent,
    ToolbarItemDirective,
    TooltipDirective,
  ],
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
  /** The kit's editing on the contenteditable: its commands, its formats on where the caret is. */
  readonly editable = viewChild(RichTextEditableDirective);

  private readonly _dialogs = inject(AnotokiDialog);

  /** The kit's buttons, in this editor's order: the formats, the lists and the indent, the link, clearing. */
  readonly tools: readonly ToolbarTool[] = ['bold', 'italic', 'underline', '|', 'bulletList', 'orderedList', 'indent', 'outdent', '|', 'link', 'clear'];

  minHeight = model<string>('200px');
  selectingFontSize = model<boolean>(false);
  remainingChars: number = 0;
  remainsWord: string = '';
  charsWord: string = '';

  selectingFontFamily = model<boolean>(false);

  maxLength = model<number | undefined>(undefined);
  maxLengthCounter = model<boolean>(true);

  showSource = signal<boolean>(false);
  sourceValue = signal<string>('');

  /**
   * Whether this editor offers a preview beside it.
   *
   * Off by default, because most fields edited here are a line of markup in a
   * form and a second pane would only take the width. It is turned on where
   * the markup is a page in its own right - a guide - and where the difference
   * between what the editor shows and what the site shows actually matters.
   */
  preview = model<boolean>(false);

  /** Open whenever the preview is offered, and collapsible from the toolbar. */
  showPreview = signal<boolean>(true);

  /**
   * What the page will make of it.
   *
   * Deliberately the same function the site renders through, not a
   * near-enough copy: a preview that shows something the page would strip is
   * worse than none, because it is confidently wrong. Anything the allowlist
   * refuses is missing here too, which is how you find out.
   */
  readonly previewHtml = computed(() => (this.value() as string | null | undefined) ?? '');

  isFocusedEditor = signal<boolean>(false);
  fontSizeValue = signal<string>('3');
  fontFamilyValue = signal<string>('Arial');
  /** The colours last given, drawn on their toolbar buttons. */
  foreColor = signal<string>('#000000');
  backColor = signal<string>('#ffffff');

  /** The panel under the toolbar, and the colour chosen in it and not applied yet. */
  readonly colorPanel = signal<ColourMode | null>(null);
  readonly pendingColor = signal<string>('');

  /** Suggested colours, each with its name (never a colour alone): the palette the editor always offered. */
  readonly swatches: readonly ColorSwatch[] = [
    { value: '#f44336', name: 'Red' },
    { value: '#e91e63', name: 'Pink' },
    { value: '#9c27b0', name: 'Purple' },
    { value: '#673ab7', name: 'Deep purple' },
    { value: '#3f51b5', name: 'Indigo' },
    { value: '#2196f3', name: 'Blue' },
    { value: '#03a9f4', name: 'Light blue' },
    { value: '#00bcd4', name: 'Cyan' },
    { value: '#009688', name: 'Teal' },
    { value: '#4caf50', name: 'Green' },
    { value: '#8bc34a', name: 'Light green' },
    { value: '#cddc39', name: 'Lime' },
    { value: '#ffeb3b', name: 'Yellow' },
    { value: '#ffc107', name: 'Amber' },
    { value: '#ff9800', name: 'Orange' },
    { value: '#ff5722', name: 'Deep orange' },
    { value: '#795548', name: 'Brown' },
    { value: '#9e9e9e', name: 'Grey' },
    { value: '#607d8b', name: 'Blue grey' },
    { value: '#000000', name: 'Black' },
    { value: '#ffffff', name: 'White' },
  ];

  private _savedRange: Range | null = null;
  private _fontSizeValueDefault: string = '3';
  private _fontFamilyValueDefault: string = 'Arial';

  readonly fontSizeOptions: DropdownOption[] = [
    { key: '1', value: 'Very small' },
    { key: '2', value: 'Small' },
    { key: '3', value: 'Normal' },
    { key: '4', value: 'Large' },
    { key: '5', value: 'Very large' },
    { key: '6', value: 'Huge' },
    { key: '7', value: 'Largest' },
  ];

  readonly fontFamilyOptions: DropdownOption[] = [
    { key: 'Arial', value: 'Arial' },
    { key: 'Times New Roman', value: 'Times New Roman' },
    { key: 'Courier New', value: 'Courier New' },
  ];

  /**
   * A press of the kit's toolbar. The formats, the lists and clearing are the
   * kit's editing (`run()`); the indent is this editor's own (a list's level,
   * else a step of margin on the blocks); a link asks for its address first.
   */
  onCommand(command: TextCommand): void {
    switch (command) {
      case 'link':
        this.askForLink();
        return;
      case 'indent':
      case 'outdent':
        this.restoreSelection();
        this.applyIndent(command === 'indent' ? 1 : -1, false);
        return;
      default:
        this.editable()?.run(command);
        this.commitEditorContent();
    }
  }

  /** The words an option of the toolbar's menus shows. */
  optionLabel(options: DropdownOption[], key: string): string {
    return String(options.find((option) => option.key === key)?.value ?? key);
  }

  /** The label pressed: the text takes the focus (a contenteditable is no control a label can focus by itself). */
  focusEditor(): void {
    this.editorElement()?.nativeElement.focus();
  }

  /** Before a toolbar item takes the focus: what it will apply to. */
  rememberSelection(): void {
    this.saveSelection();
  }

  private saveSelection(): void {
    const editor = this.editorElement()?.nativeElement;
    const selection = window.getSelection();
    if (editor && selection && selection.rangeCount > 0 && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      this._savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  /**
   * The focus back in the text, and the selection where it was left - unless
   * it is still there (a press with a pointer leaves it), which a stale copy
   * must not replace.
   */
  private restoreSelection(): void {
    const el = this.editorElement()?.nativeElement;
    if (!el) {
      return;
    }
    const selection = window.getSelection();
    const inside = !!selection && selection.rangeCount > 0 && el.contains(selection.getRangeAt(0).commonAncestorContainer);
    if (document.activeElement !== el) {
      el.focus();
    }
    if (!inside && selection && this._savedRange) {
      selection.removeAllRanges();
      selection.addRange(this._savedRange);
    }
  }

  /**
   * The link's address, asked in this editor's own dialog; then the kit's
   * `link()` (an address it lets in, or nothing done), or - the caret in a
   * link already - that link's address changed or the link taken away.
   */
  private askForLink(): void {
    this.saveSelection();
    const anchor = this.linkAtSelection();
    const ref = this._dialogs.open<HtmlEditorLinkDialogComponent, HtmlEditorLinkResult, HtmlEditorLinkData>(HtmlEditorLinkDialogComponent, {
      heading: anchor ? 'Change the link' : 'Add a link',
      size: 'sm',
      data: { inLink: !!anchor, address: anchor?.getAttribute('href') ?? '' },
    });
    void ref.closed.then((result) => {
      const editable = this.editable();
      if (!result || !editable) {
        this.restoreSelection();
        return;
      }
      if ('remove' in result) {
        this.restoreSelection();
        if (anchor && this.editorElement()?.nativeElement.contains(anchor)) {
          this.selectNode(anchor);
        }
        editable.unlink();
      } else if (anchor && this._savedRange?.collapsed && this.editorElement()?.nativeElement.contains(anchor)) {
        // The caret in a link, nothing selected: that link's address changes (createLink needs selected words).
        this.restoreSelection();
        this.selectNode(anchor);
        editable.link(result.address);
      } else {
        editable.link(result.address);
      }
      this.commitEditorContent();
    });
  }

  /** The link the saved selection is in, inside this editor - or null. */
  private linkAtSelection(): HTMLAnchorElement | null {
    const editor = this.editorElement()?.nativeElement;
    const node = this._savedRange?.commonAncestorContainer ?? null;
    const element = node instanceof Element ? node : (node?.parentElement ?? null);
    const anchor = element?.closest('a') ?? null;
    return anchor && editor?.contains(anchor) ? anchor : null;
  }

  /** Selects the whole of a node of the text (a link, to change or to take away). */
  private selectNode(node: Node): void {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    this._savedRange = range.cloneRange();
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
    this.commitEditorContent();
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
    this.commitEditorContent();
  }

  /** Opens the colour panel for the words' colour or their ground, starting from the one last given - or closes it. */
  toggleColors(mode: ColourMode): void {
    if (this.colorPanel() === mode) {
      this.closeColors(false);
      return;
    }
    this.saveSelection();
    this.pendingColor.set(mode === 'fore' ? this.foreColor() : this.backColor());
    this.colorPanel.set(mode);
  }

  /** The colour chosen in the panel, on the words selected; the panel closes and the text has the focus. */
  applyColor(mode: ColourMode): void {
    const colour = this.pendingColor();
    if (!colour) {
      return;
    }
    this.restoreSelection();
    document.execCommand(mode === 'fore' ? 'foreColor' : 'backColor', false, colour);
    (mode === 'fore' ? this.foreColor : this.backColor).set(colour);
    this.saveSelection();
    this.commitEditorContent();
    this.colorPanel.set(null);
  }

  /** No colour: the words' own (or their ground) taken off the selection. */
  clearColor(mode: ColourMode): void {
    this.restoreSelection();
    if (mode === 'fore') {
      this.removeStyleFromSelection(['color'], ['color']);
      this.foreColor.set('#000000');
    } else {
      this.removeStyleFromSelection(['background-color', 'background'], ['bgcolor']);
      this.backColor.set('#ffffff');
    }
    this.saveSelection();
    this.commitEditorContent();
    this.colorPanel.set(null);
  }

  /** The panel closed - by Escape or Close the focus back on the button that opened it. */
  closeColors(returnFocus: boolean): void {
    const mode = this.colorPanel();
    this.colorPanel.set(null);
    if (returnFocus && mode) {
      const button = this.elementRef.nativeElement.querySelector(`.toolbar-colour[aria-label="${mode === 'fore' ? 'Text colour' : 'Highlight colour'}"]`) as HTMLElement | null;
      button?.focus();
    }
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
      const shortcut = ({ b: 'bold', i: 'italic', u: 'underline' } as const)[event.key.toLowerCase() as 'b' | 'i' | 'u'];
      if (shortcut && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        this.editable()?.run(shortcut);
        this.commitEditorContent();
      }
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.applyIndent(event.shiftKey ? -1 : 1, !event.shiftKey && !this.isInList());
    }
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
    // A stored text goes into this live page only through the allow-list: it keeps what the toolbar makes (the font,
    // colour, background and indent styles, safe links) and drops every event handler and script - a text written
    // in the HTML source or sent to the API straight is anybody's markup.
    const safe = sanitizeRichHtml(value ?? '');
    if (el && el.innerHTML !== safe) {
      el.innerHTML = safe;
    }
    if (!this.showSource()) {
      this.sourceValue.set(value ?? '');
    }
    this.recalculateRemainingLength();
  }

  toggleSource(): void {
    if (this.showSource()) {
      this.showSource.set(false);
    } else {
      this.colorPanel.set(null);
      this.sourceValue.set(this.value() ?? '');
      this.showSource.set(true);
    }
  }

  togglePreview(): void {
    this.showPreview.set(!this.showPreview());
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
