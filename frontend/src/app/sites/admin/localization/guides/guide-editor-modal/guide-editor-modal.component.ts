import { Component, computed, inject, model, signal } from '@angular/core';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GuideApiService, GuideEditorEntry, GuideEditorLanguage } from '../../../../../api';
import { HtmlEditorComponent } from '@anotoki/lib/ui/html-editor';
import { EDITOR_FONTS, EDITOR_SWATCHES, RICH_TEXT_CLASSES } from '../../../../../shared/rich-text';
import { ButtonComponent } from '@anotoki/lib/ui/button';
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
/** What the Guides page hands over when it opens a guide. */
export interface GuideEditorData {
  guide: string;
  heading: string;
  languages: GuideEditorLanguage[];
  initial: Record<string, string>;
}

@Component({
  selector: 'app-guide-editor-modal',
  templateUrl: './guide-editor-modal.component.html',
  styleUrls: ['./guide-editor-modal.component.scss'],
  imports: [DialogFooterDirective, HtmlEditorComponent, ButtonComponent],
})
export class GuideEditorModalComponent extends AbstractModalComponent {
  private readonly _api = inject(GuideApiService);
  private readonly _data = inject<GuideEditorData | null>(ANOTOKI_DIALOG_DATA, { optional: true });

  /** The guide being edited, and its title as the pages show it: what the Guides page hands over. */
  readonly guide = signal<string>(this._data?.guide ?? '');
  readonly heading = signal<string>(this._data?.heading ?? '');

  readonly languages = signal<GuideEditorLanguage[]>(this._data?.languages ?? []);
  /** Language code to markup, as it stood when the dialog opened. */
  readonly initial = signal<Record<string, string>>({ ...(this._data?.initial ?? {}) });

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

  /** The editor (@anotoki/lib/ui/html-editor): the sizes, the fonts and the colours it always had, its HTML source, the preview beside it, the guides' "tag". */
  readonly editorFonts = EDITOR_FONTS;
  readonly editorSwatches = EDITOR_SWATCHES;
  readonly richTextClasses = RICH_TEXT_CLASSES;

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

  constructor() {
    super();
    this.dialogHeading(() => this.heading() || this.guide());
    this.start();
  }

  /** The first language's pane, open on what is saved. */
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
      this.dialogRef?.close(null);
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const saved: GuideEditorEntry = await firstValueFrom(this._api.saveAdminGuide(this.guide(), { values }));
      this.dialogRef?.close(saved);
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
    this.dialogRef?.close(null);
  }
}
