import { Component, OnInit, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { ErrorStateComponent } from '@anotoki/lib/ui/error-state';
import { BadgeComponent } from '@anotoki/lib/ui/badge';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslationService } from '@anotoki/lib/translations';
import { GuideApiService, GuideEditorEntry, GuideEditorLanguage } from '../../../../api';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { GUIDES, GuideId } from '../../../main/common/guide/guide-catalog';
import { GuideEditorData, GuideEditorModalComponent } from './guide-editor-modal/guide-editor-modal.component';

/** Why the guides could not be read, in the server's words where it said any. */
function failureText(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'The server could not be reached.';
    }
    const said = error.error?.error;
    if (typeof said === 'string' && said) {
      return said;
    }
  }
  return 'The guides could not be read.';
}

/**
 * The guides behind the question marks - one for the Daily, the quizzes, the
 * games and each of them - on a page of their own since they are no longer
 * strings (users/050): a page of markup each, in every language that has one.
 *
 * A row per guide, with the languages it has markup in; Edit opens the HTML
 * editor with every language at once (GuideEditorModalComponent), which saves
 * what changed. The titles are strings (guide.<id>.title), reworded on the
 * Translations page. Guides come with migrations, as keys do: this page
 * changes the ones there are. ADMIN or EDITOR, who may reword the strings.
 */
@Component({
  selector: 'app-admin-guides',
  templateUrl: './guides.component.html',
  styleUrls: ['./guides.component.scss'],
  imports: [PageHeaderComponent, ErrorStateComponent, BadgeComponent, SpinnerComponent, ButtonComponent],
})
export class GuidesComponent extends AbstractModalComponent implements OnInit {
  private readonly _api = inject(GuideApiService);
  private readonly _i18n = inject(TranslationService);

  readonly guides = signal<GuideEditorEntry[]>([]);
  readonly languages = signal<GuideEditorLanguage[]>([]);
  /** Why the guides could not be read, or null. */
  readonly failed = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(null);
    this._api.getAdminGuides().subscribe({
      next: (view) => {
        this.guides.set(view.guides);
        this.languages.set(view.languages);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.failed.set(failureText(error));
        this.loading.set(false);
      },
    });
  }

  /** The guide's title as the pages show it (English, in here), or its name when the pages do not know it. */
  title(entry: GuideEditorEntry): string {
    const guide = Object.hasOwn(GUIDES, entry.guide) ? GUIDES[entry.guide as GuideId] : null;
    return guide ? this._i18n.t(guide.title) : entry.guide;
  }

  has(entry: GuideEditorEntry, code: string): boolean {
    return Object.hasOwn(entry.values, code);
  }

  edit(entry: GuideEditorEntry): void {
    const modal = this.openModal<GuideEditorEntry | null, GuideEditorData>(GuideEditorModalComponent, {
      size: 'lg',
      description: 'The guide behind its question mark, in every language. Empty: the language reads the English.',
      data: { guide: entry.guide, heading: this.title(entry), languages: this.languages(), initial: { ...entry.values } },
    });

    void modal.closed.then((saved) => {
      if (saved) {
        this.guides.update((guides) => guides.map((guide) => (guide.guide === saved.guide ? saved : guide)));
        this.notificationService.success(`${this.title(saved)}: saved.`);
      }
    });
  }
}
