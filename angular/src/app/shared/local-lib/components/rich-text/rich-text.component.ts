import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { sanitizeRichHtml } from '../../rich-html';

/**
 * Markup from the database, on the page.
 *
 * Everywhere else a string from the translations table is text and the
 * translate pipe writes it as text. This is the one component that renders one
 * as markup, which makes it the one place where that decision is made - so it
 * is the component, not the string, that has to be trusted.
 *
 * The markup is put through `sanitizeRichHtml` first and only then handed to
 * Angular as trusted. The bypass is not a shortcut around sanitizing: it is
 * there because Angular's own sanitizer drops the inline styles the HTML
 * editor writes, and replacing it with a policy that keeps them means saying
 * so explicitly. What actually decides what survives is the allowlist.
 */
@Component({
  selector: 'app-rich-text',
  template: `<div class="rich-text" [innerHTML]="safe()"></div>`,
  styleUrls: ['./rich-text.component.scss'],
  // Markup set through innerHTML is never stamped with the component's own
  // attribute, so scoped styles would not reach a single element of it. The
  // rules are all under .rich-text, which is the scope instead.
  encapsulation: ViewEncapsulation.None,
})
export class RichTextComponent {
  readonly html = input<string | null | undefined>('');

  private readonly _sanitizer = inject(DomSanitizer);

  readonly safe = computed(() => this._sanitizer.bypassSecurityTrustHtml(sanitizeRichHtml(this.html())));
}
