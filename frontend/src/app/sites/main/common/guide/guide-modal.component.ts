import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ANOTOKI_DIALOG_DATA } from '@anotoki/lib/ui/dialog';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { GuideApiService } from '../../../../api';
import { RichTextComponent } from '../../../../shared/local-lib/components/rich-text/rich-text.component';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { GUIDES, Guide, GuideId } from './guide-catalog';

/**
 * What a question mark opens: a page of markup explaining one quiz, one game,
 * or one part of the site.
 *
 * The old site kept these in a data file, in English, as template literals, so
 * they could not be translated and could not be corrected without a deploy.
 * They were translations for a while; since users/050 they are content of
 * their own, edited on the admin panel's Guides page and asked for here, in the
 * reader's language - GET /api/guides/{id}, English where the guide has none in
 * it. Markup, which is why the body goes through app-rich-text instead of the
 * pipe. The heading is still a string.
 */
@Component({
  selector: 'app-guide-modal',
  templateUrl: './guide-modal.component.html',
  styleUrls: ['./guide-modal.component.scss'],
  imports: [RichTextComponent, SpinnerComponent, TranslatePipe],
})
export class GuideModalComponent extends AbstractModalComponent {
  private readonly _i18n = inject(TranslationService);
  private readonly _guides = inject(GuideApiService);

  /** Which guide: what the question mark that opened this hands over. */
  readonly guide = signal<GuideId | null>(inject<GuideId | null>(ANOTOKI_DIALOG_DATA, { optional: true }));

  private readonly _entry = computed<Guide | null>(() => {
    const id = this.guide();
    return id ? (GUIDES[id] ?? null) : null;
  });

  readonly title = computed(() => {
    const entry = this._entry();
    return entry ? this._i18n.t(entry.title) : '';
  });

  /** The guide's markup, once it is here. */
  readonly html = signal('');

  /** The guide could not be had: said instead of an empty page. */
  readonly failed = signal(false);

  constructor() {
    super();
    this.dialogHeading(() => this.title());

    // Asked for when the guide is set - and again if the reader's language
    // changes while it is open. A request still out when either changes, or
    // when the modal closes, is dropped.
    effect((onCleanup) => {
      const entry = this._entry();
      const language = this._i18n.language();
      if (!entry) {
        return;
      }

      const request = untracked(() => {
        this.loading.set(true);
        this.failed.set(false);
        return this._guides.getGuide(entry.id, { language }).subscribe({
          next: (answer) => {
            this.html.set(answer.html);
            this.loading.set(false);
          },
          error: () => {
            this.failed.set(true);
            this.loading.set(false);
          },
        });
      });
      onCleanup(() => request.unsubscribe());
    });
  }
}
