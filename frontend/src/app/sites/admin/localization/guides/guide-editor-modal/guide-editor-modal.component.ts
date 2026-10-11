import { Component, computed, inject, model, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GuideApiService, GuideEditorEntry, GuideEditorLanguage } from '../../../../../api';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { HtmlEditorComponent } from '../../../../../shared/local-lib/components/html-editor/html-editor.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';

/** The server's sentence for a refused save, or a plain one when there was no answer. */
function refusalText(failure: unknown): string {
  if (failure instanceof HttpErrorResponse) {
    if (failure.status === 0) {
      return 'The server could not be reached. Nothing was saved - try again.';
    }
    const said = failure.error?.error;
    if (typeof said === 'string' && said) {
      return `Not saved: ${said}.`;
    }
  }
  return 'The guide could not be saved. Try again.';
}

/**
 * Editing one guide: a page of markup rather than a sentence, so the HTML
 * editor with the preview beside it, one language at a time - the editor the
 * Translations grid used to open for the guides, before they were content of
 * their own (users/050).
 *
 * Every language is loaded at once and switched between by tab, because the
 * reason to open this is usually to bring one language level with another -
 * and the hidden languages are there too, so a guide can be written before
 * its language is offered.
 *
 * Save sends only the languages that changed (PUT /api/admin/guides/{guide})
 * and closes with the guide as it now is; a refusal is said here, with every
 * edit kept, so nothing typed is lost to a failed save. Emptying a language
 * deletes its markup - the guide then reads in English there - and English
 * cannot be left empty.
 */
@Component({
  selector: 'app-guide-editor-modal',
  templateUrl: './guide-editor-modal.component.html',
  styleUrls: ['./guide-editor-modal.component.scss'],
  imports: [ModalComponent, HtmlEditorComponent, ButtonComponent],
})
export class GuideEditorModalComponent extends AbstractModalComponent {
  private readonly _api = inject(GuideApiService);

  /** The guide being edited, and its title as the pages show it. */
  readonly guide = model<string>('');
  readonly heading = model<string>('');

  readonly languages = model<GuideEditorLanguage[]>([]);
  /** Language code to markup, as it stood when the modal opened. */
  readonly initial = model<Record<string, string>>({});

  readonly current = signal<Record<string, string>>({});
  readonly active = signal<string>('');
  readonly saving = signal(false);
  /** Why the last save was refused, in the server's words; null when it was not. */
  readonly error = signal<string | null>(null);

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

  async save(): Promise<void> {
    this.commit();

    const values: Record<string, string> = {};
    for (const language of this.languages()) {
      const before = this.initial()[language.code] ?? '';
      const after = this.current()[language.code] ?? '';
      if (before !== after) {
        values[language.code] = after;
      }
    }
    if (!Object.keys(values).length) {
      this.modalRef?.close(null);
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const saved: GuideEditorEntry = await firstValueFrom(this._api.saveAdminGuide(this.guide(), { values }));
      this.modalRef?.close(saved);
    } catch (failure: unknown) {
      this.error.set(refusalText(failure));
      // A refusal about one language: show that one.
      const language = failure instanceof HttpErrorResponse ? failure.error?.language : null;
      if (typeof language === 'string' && this.languages().some((candidate) => candidate.code === language)) {
        this.select(language);
      }
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.modalRef?.close(null);
  }
}
