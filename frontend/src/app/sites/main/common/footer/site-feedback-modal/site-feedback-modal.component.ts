import { Component, computed, inject } from '@angular/core';
import { feedbackWords } from '@anotoki/lib/feedback';
import { FeedbackFormComponent } from '@anotoki/lib/feedback/form';
import { TranslationService } from '@anotoki/lib/translations';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';

/**
 * The footer's Feedback: the anotoki library's form (@anotoki/lib/feedback,
 * configured in shared/site-feedback.ts) in this site's dialog - for visitors
 * and players alike, in their language. What it is about, where, the message,
 * a bug's or an idea's own fields, an address for an answer; sent, the thanks
 * in place, and Close.
 *
 * Loaded only when somebody opens it (the footer's `load`): the form brings
 * the kit's fields, which no page of the site needs before then.
 */
@Component({
  selector: 'app-site-feedback-modal',
  templateUrl: './site-feedback-modal.component.html',
  styleUrls: ['./site-feedback-modal.component.scss'],
  imports: [ModalComponent, FeedbackFormComponent],
})
export class SiteFeedbackModalComponent extends AbstractModalComponent {
  private readonly _i18n = inject(TranslationService);

  /** The form's own title - an owner's rewording first, as the form reads its words - heading the dialog instead of the form. */
  readonly title = computed(() => feedbackWords(this._i18n.language(), undefined, (key) => this._i18n.libraryWord(key)).words.title);
}
