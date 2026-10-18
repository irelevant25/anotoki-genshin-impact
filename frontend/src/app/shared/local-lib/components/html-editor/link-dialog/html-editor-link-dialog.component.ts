import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, AnotokiDialogRef, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { safeLinkAddress } from '@anotoki/lib/ui/rich-text';

/** What the editor tells the dialog: whether the caret is in a link already, and its address. */
export interface HtmlEditorLinkData {
  inLink: boolean;
  address: string;
}

/** What the dialog answers: an address the kit lets in, or the link taken away. Dismissed: nothing. */
export type HtmlEditorLinkResult = { address: string } | { remove: true };

/**
 * The HTML editor's link, asked in its own dialog - never the browser's
 * prompt(): the kit's dialog, the focus in it and back afterwards, the words
 * the admin panel's (English).
 *
 * Only an address the kit lets into a text is taken (`safeLinkAddress()`: a
 * web, mail or this site's own address - never javascript: or data:); any
 * other is refused here with why, and nothing is done. That is a convenience:
 * the server keeps a text as it was written, and what decides is the page's
 * allow-list (rich-html.ts), which every stored text goes through wherever it
 * reaches a live page - the site, the preview, the editor as it loads one.
 */
@Component({
  selector: 'app-html-editor-link-dialog',
  imports: [ButtonComponent, DialogFooterDirective, TextFieldComponent],
  templateUrl: './html-editor-link-dialog.component.html',
  styleUrl: './html-editor-link-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HtmlEditorLinkDialogComponent {
  private readonly _ref = inject<AnotokiDialogRef<HtmlEditorLinkResult>>(AnotokiDialogRef);
  readonly data = inject<HtmlEditorLinkData>(ANOTOKI_DIALOG_DATA);

  readonly address = signal(this.data.address);
  /** Said once an add was tried with an address the kit refuses. */
  private readonly _tried = signal(false);
  private readonly _safe = computed(() => safeLinkAddress(this.address().trim()));

  readonly error = computed(() =>
    this._tried() && this._safe() === null ? "That cannot be a link here: write a web address (https://…), a mail address (mailto:…) or one of this site's own (/database/…)." : null,
  );

  add(): void {
    this._tried.set(true);
    const address = this._safe();
    if (address !== null) {
      this._ref.close({ address });
    }
  }

  remove(): void {
    this._ref.close({ remove: true });
  }

  cancel(): void {
    this._ref.close();
  }
}
