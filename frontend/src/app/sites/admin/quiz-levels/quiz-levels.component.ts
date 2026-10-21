import { Component, HostListener, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { ErrorStateComponent } from '@anotoki/lib/ui/error-state';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { CodeEditorComponent } from '@anotoki/lib/ui/code-editor';
import { ConfirmService } from '@anotoki/lib/ui/dialog';
import { ToastService } from '@anotoki/lib/ui/toast';
import { QuizLevelApiService, QuizLevelProblem, QuizLevelsEditorView } from '../../../api';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';
import { QUIZ_LEVELS, usableLevels } from '../../main/features/quizzes/shared/quiz-levels';
import { LevelWordsWarning, levelWordsWarnings, levelsText, placeOf } from './quiz-level-words';

/** How long the editor waits after the last key before it asks the rules. */
const CHECK_AFTER_MS = 400;

/** The built-in levels, as the editor shows them. */
const BUILT_IN_TEXT = levelsText(QUIZ_LEVELS);

/** What went wrong, in the server's words where it said any. */
function failureText(error: unknown, otherwise: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'The server could not be reached.';
    }
    const said = error.error?.error;
    if (typeof said === 'string' && said) {
      return said;
    }
  }
  return otherwise;
}

/**
 * The quizzes' levels - what each level of each quiz shows, try by try - on
 * a page of their own since they are data (users/061, the owner's decision of
 * 2026-10-21): the levels in force as JSON in the kit's code editor
 * (anotoki-lib 0.9.2: it colours the JSON), what the server's
 * rules say of them as they are written (POST /api/admin/quiz-levels/check -
 * the server is the rule, so the page says its words, never its own), the
 * words of the site they would leave behind (quiz-level-words.ts), and Save
 * and "Back to the defaults", both of which the audit log keeps.
 *
 * Nothing saved, the editor holds the built-in levels (quiz-levels.ts); a
 * saved set the rules no longer take is shown as saved, with why the quizzes
 * play the built-in levels instead. ADMIN or EDITOR, as the content is.
 * Leaving with changes not saved asks first (anotokiUnsavedChangesGuard on
 * the route; the browser's own question for a reload or a closed tab).
 */
@Component({
  selector: 'app-admin-quiz-levels',
  templateUrl: './quiz-levels.component.html',
  styleUrls: ['./quiz-levels.component.scss'],
  imports: [PageHeaderComponent, ErrorStateComponent, SpinnerComponent, ButtonComponent, CodeEditorComponent, AppDatePipe, RouterLink],
})
export class QuizLevelsComponent implements OnInit, OnDestroy {
  private readonly _api = inject(QuizLevelApiService);
  private readonly _confirm = inject(ConfirmService);
  private readonly _toast = inject(ToastService);

  readonly loading = signal(true);
  /** Why the levels could not be read, or null. */
  readonly failed = signal<string | null>(null);
  /** A save or a reset on its way. */
  readonly busy = signal(false);

  /** What the server keeps: the levels saved (null: none - the built-in ones are in force), when, and what the rules say of them. */
  readonly view = signal<QuizLevelsEditorView | null>(null);

  /** The editor's text, and the text it started from: what is saved, or the built-in levels. */
  readonly text = signal('');
  private readonly _start = signal('');
  readonly dirty = computed(() => this.text() !== this._start());

  /** The text as JSON, or the browser's words for why it is not. */
  private readonly _parsed = computed<{ readonly value: unknown } | { readonly error: string }>(() => {
    try {
      return { value: JSON.parse(this.text()) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  });
  readonly syntaxError = computed(() => {
    const parsed = this._parsed();
    return 'error' in parsed ? `Not JSON yet: ${parsed.error}` : null;
  });

  /** What the rules said of the text last asked about; null while they are asked, or while the text is no JSON. */
  readonly problems = signal<QuizLevelProblem[] | null>(null);
  /** The rules could not be asked (the server out of reach). */
  readonly checkFailed = signal(false);

  /** The site's words these levels would leave behind - said once the rules take them. */
  readonly warnings = computed<LevelWordsWarning[]>(() => {
    const parsed = this._parsed();
    const levels = this.problems()?.length === 0 && 'value' in parsed ? usableLevels(parsed.value) : null;
    return levels ? levelWordsWarnings(levels) : [];
  });

  readonly canSave = computed(() => this.dirty() && !this.busy() && this.problems()?.length === 0);
  /** "Back to the defaults" has something to do: levels saved, or other levels than the built-in ones in the editor. */
  readonly canReset = computed(() => !this.busy() && (this.view()?.levels != null || this.text() !== BUILT_IN_TEXT));

  readonly placeOf = placeOf;

  private _asked = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // The rules asked again a moment after the text stops changing - only the latest answer heard.
    effect(() => {
      const parsed = this._parsed();
      untracked(() => this._askRules(parsed));
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._stopAsking();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(null);
    this._api.getAdminQuizLevels().subscribe({
      next: (view) => {
        this._show(view);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.failed.set(failureText(error, 'The quiz levels could not be read.'));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const parsed = this._parsed();
    if (!this.canSave() || !('value' in parsed)) {
      return;
    }
    this.busy.set(true);
    this._api.saveAdminQuizLevels({ levels: parsed.value }).subscribe({
      next: (view) => {
        this.busy.set(false);
        this._show(view);
        this._toast.success('Quiz levels saved: every quiz plays them from its next page load.');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        // Refused for what the rules say (another tab's rules, a newer server): the page says it as the check would.
        const problems = error instanceof HttpErrorResponse ? error.error?.problems : null;
        if (Array.isArray(problems)) {
          this.problems.set(problems as QuizLevelProblem[]);
        }
        this._toast.error(failureText(error, 'The quiz levels could not be saved.'));
      },
    });
  }

  /** The editor back to what it started from: what is saved, or the built-in levels. */
  discard(): void {
    this.text.set(this._start());
  }

  async backToDefaults(): Promise<void> {
    const saved = this.view()?.levels != null;
    const sure = await this._confirm.ask(
      saved
        ? {
            title: 'Back to the built-in levels?',
            message: 'Every quiz plays the built-in levels again, from its next page load. What is saved now goes - the audit log keeps it.',
            confirmLabel: 'Back to the defaults',
            tone: 'danger',
          }
        : { title: 'Back to the built-in levels?', message: 'Your changes here go, and the editor shows the built-in levels again.', confirmLabel: 'Back to the defaults', tone: 'danger' },
    );
    if (!sure) {
      return;
    }
    if (!saved) {
      this.text.set(BUILT_IN_TEXT);
      this._start.set(BUILT_IN_TEXT);
      return;
    }
    this.busy.set(true);
    this._api.resetAdminQuizLevels().subscribe({
      next: (view) => {
        this.busy.set(false);
        this._show(view);
        this._toast.success('Back to the built-in levels: every quiz plays them from its next page load.');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this._toast.error(failureText(error, 'The quiz levels could not be reset.'));
      },
    });
  }

  /** Asked by the route's guard before the page is left: with changes not saved, the person says. */
  canLeave(): boolean | Promise<boolean> {
    return !this.dirty() || this._confirm.ask({ title: 'Leave without saving?', message: 'Your changes to the quiz levels are not saved.', confirmLabel: 'Leave', tone: 'danger' });
  }

  /** A reload or a closed tab with changes not saved: the browser asks. */
  @HostListener('window:beforeunload', ['$event'])
  protected beforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  private _show(view: QuizLevelsEditorView): void {
    this.view.set(view);
    const text = view.levels === null ? BUILT_IN_TEXT : levelsText(view.levels);
    this._start.set(text);
    this.text.set(text);
  }

  private _askRules(parsed: { readonly value: unknown } | { readonly error: string }): void {
    const asked = ++this._asked;
    this._stopAsking();
    this.problems.set(null);
    this.checkFailed.set(false);
    if (!('value' in parsed)) {
      return;
    }
    this._timer = setTimeout(() => {
      this._timer = null;
      this._api.checkAdminQuizLevels({ levels: parsed.value }).subscribe({
        next: (answer) => {
          if (asked === this._asked) {
            this.problems.set(answer.problems);
          }
        },
        error: () => {
          if (asked === this._asked) {
            this.checkFailed.set(true);
          }
        },
      });
    }, CHECK_AFTER_MS);
  }

  private _stopAsking(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
