import { Component, inject, input } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { TranslationService } from '../../../../shared/local-lib/i18n/translation.service';
import { GUIDES, GuideId } from './guide-catalog';
import { GuideModalComponent } from './guide-modal.component';

/**
 * The question mark, and what happens when it is pressed.
 *
 * A button rather than an icon with a click handler, so it can be reached by
 * keyboard and announces itself - these sit on top of the cards, and a card is
 * a link. That is also why the click is stopped here: pressing the question
 * mark on the Banners card should explain the quiz, not start it.
 */
@Component({
  selector: 'app-guide-icon',
  template: `
    <button type="button" class="guide-icon" [attr.aria-label]="label()" [title]="label()" (click)="open($event)">
      <i class="icon icon-info" aria-hidden="true"></i>
    </button>
  `,
  styleUrls: ['./guide-icon.component.scss'],
})
export class GuideIconComponent extends AbstractModalComponent {
  private readonly _i18n = inject(TranslationService);

  readonly guide = input.required<GuideId>();

  /** The guide's own title, which is already "About the Banners quiz". */
  label(): string {
    return this._i18n.t(GUIDES[this.guide()].title);
  }

  open(event: MouseEvent): void {
    // The card underneath is a link to the quiz itself.
    event.preventDefault();
    event.stopPropagation();

    const modal = this.openModal(GuideModalComponent, { size: '3', scrollable: true, centered: true });
    modal.componentInstance.guide.set(this.guide());
  }
}
