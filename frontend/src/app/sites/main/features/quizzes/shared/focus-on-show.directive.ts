import { afterNextRender, Directive, DOCUMENT, ElementRef, inject } from '@angular/core';

/**
 * Whether the device's main pointer is a fine one - a mouse, a trackpad -
 * which is where the quizzes are played from a keyboard. Only there does
 * anything on them take the focus by itself: on a touch screen a focused
 * field opens the keyboard over the question.
 */
export function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
}

/**
 * A button that moves a quiz on - Next, once a question is over - for
 * whoever plays it from the keyboard.
 *
 * As it appears it takes the focus, so Enter or Space press it as they press
 * any button: without scrolling (it stands where the search box stood), and
 * only where the pointer is fine (finePointer()). And while it is on the page,
 * an Enter pressed with nothing focused - the focus lost with the field it was
 * in, or a click on the page's background - presses it too. Any other Enter
 * is left alone: one in a field or on another button, with a modifier key,
 * one something else has already handled, and one while a dialog is open,
 * whose own focus may have dropped to the page.
 *
 * Only a press presses it, never a key held down: the Enter that chose the
 * last guess can still be down when the button takes the focus, and its
 * repeats would move on past the answer before anybody saw it.
 */
@Directive({
  selector: '[appFocusOnShow]',
  host: { '(keydown)': 'onKeydown($event)', '(document:keydown)': 'onDocumentKeydown($event)' },
})
export class FocusOnShowDirective {
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      if (finePointer()) {
        this._host.nativeElement.focus({ preventScroll: true });
      }
    });
  }

  /** A held Enter's repeats on the button itself are cancelled, and with them the press each would be. (Space presses as it comes up, once.) */
  onKeydown(event: KeyboardEvent): void {
    if (event.repeat && event.key === 'Enter') {
      event.preventDefault();
    }
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (
      event.key !== 'Enter' ||
      event.repeat ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target !== this._document.body ||
      this._document.querySelector('dialog[open]')
    ) {
      return;
    }
    event.preventDefault();
    this._host.nativeElement.click();
  }
}
