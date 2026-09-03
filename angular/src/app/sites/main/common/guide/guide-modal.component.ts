import { Component, computed, inject, model } from '@angular/core';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { RichTextComponent } from '../../../../shared/local-lib/components/rich-text/rich-text.component';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { GUIDES, Guide, GuideId } from './guide-catalog';

/**
 * What a question mark opens: a page of markup explaining one quiz, one game,
 * or one part of the site.
 *
 * The old site kept these in a data file, in English, as template literals. So
 * they could not be translated and could not be corrected without a deploy.
 * They are translations now - which is what makes the body markup rather than
 * a sentence, and why it goes through app-rich-text instead of the pipe.
 */
@Component({
  selector: 'app-guide-modal',
  templateUrl: './guide-modal.component.html',
  styleUrls: ['./guide-modal.component.scss'],
  imports: [ModalComponent, RichTextComponent],
})
export class GuideModalComponent extends AbstractModalComponent {
  private readonly _i18n = inject(TranslationService);

  /**
   * Set by whoever opened the modal. A signal rather than a plain field: the
   * app is zoneless, so assigning to a property after the component exists
   * would not repaint it.
   */
  readonly guide = model<GuideId | null>(null);

  private readonly _entry = computed<Guide | null>(() => {
    const id = this.guide();
    return id ? (GUIDES[id] ?? null) : null;
  });

  readonly title = computed(() => {
    const entry = this._entry();
    return entry ? this._i18n.t(entry.title) : '';
  });

  readonly content = computed(() => {
    const entry = this._entry();
    return entry ? this._i18n.t(entry.content) : '';
  });
}
