import { Component, computed, inject, model, signal } from '@angular/core';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { HtmlEditorComponent } from '../../../../../shared/local-lib/components/html-editor/html-editor.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { Language } from '../../../../../api';

/** One language's markup, as it goes in and as it comes back. */
export interface HtmlTranslationEdit {
  readonly code: string;
  readonly value: string;
}

/**
 * Editing a translation that is a page rather than a sentence.
 *
 * The grid gives a key one row and a language one cell, which is the right
 * shape for a label and hopeless for a guide. So a key flagged `is_html`
 * opens here instead: one language at a time, in the HTML editor, with the
 * preview beside it.
 *
 * Every language of the key is loaded at once and switched between by tab,
 * because the reason to open this is usually to bring one language level with
 * another - and doing that through a grid means scrolling sideways.
 */
@Component({
  selector: 'app-html-translation-modal',
  templateUrl: './html-translation-modal.component.html',
  styleUrls: ['./html-translation-modal.component.scss'],
  imports: [ModalComponent, HtmlEditorComponent, ButtonComponent],
})
export class HtmlTranslationModalComponent extends AbstractModalComponent {
  /** The key being edited, and the note explaining where it appears. */
  readonly keyName = model<string>('');
  readonly description = model<string | null>(null);

  readonly languages = model<Language[]>([]);
  /** Language code to markup, as it stood when the modal opened. */
  readonly initial = model<Record<string, string>>({});

  readonly current = signal<Record<string, string>>({});
  readonly active = signal<string>('');

  /**
   * The editor binds a model, so it writes back into whatever signal is handed
   * to it. One signal for the pane, copied out on every change - simpler than
   * a signal per language, and there is only ever one pane open.
   */
  readonly draft = model<string>('');

  readonly dirty = computed(() => {
    const before = this.initial();
    const after = this.current();
    return Object.keys({ ...before, ...after }).some((code) => (before[code] ?? '') !== (after[code] ?? ''));
  });

  /** Marks the tabs that have been touched, so a half-finished pass is visible. */
  isEdited(code: string): boolean {
    return (this.initial()[code] ?? '') !== (this.current()[code] ?? '');
  }

  hasValue(code: string): boolean {
    return !!(this.current()[code] ?? '').trim();
  }

  /** Called once by whoever opened the modal, after the inputs are set. */
  start(): void {
    this.current.set({ ...this.initial() });
    const first = this.languages()[0]?.code ?? '';
    this.select(this.active() || first);
  }

  select(code: string): void {
    this.commit();
    this.active.set(code);
    this.draft.set(this.current()[code] ?? '');
  }

  /** Moves what the editor holds into the language it belongs to. */
  commit(): void {
    const code = this.active();
    if (!code) {
      return;
    }
    const value = this.draft();
    this.current.update((all) => ({ ...all, [code]: value }));
  }

  /** Puts one language back to what it was, without closing. */
  revert(): void {
    const code = this.active();
    this.draft.set(this.initial()[code] ?? '');
    this.commit();
  }

  save(): void {
    this.commit();

    const changed: HtmlTranslationEdit[] = [];
    for (const language of this.languages()) {
      const before = this.initial()[language.code] ?? '';
      const after = this.current()[language.code] ?? '';
      if (before !== after) {
        changed.push({ code: language.code, value: after });
      }
    }

    // Closing with the edits, rather than saving from here: the grid holds
    // everything else that is pending and saves the lot in one request.
    this.modalRef?.close(changed);
  }

  cancel(): void {
    this.modalRef?.close(null);
  }
}
