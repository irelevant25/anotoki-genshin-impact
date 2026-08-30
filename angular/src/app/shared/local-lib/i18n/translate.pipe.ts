import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

/**
 * `{{ 'nav.database' | translate }}`, and with placeholders filled in:
 * `{{ 'quiz.score' | translate: { score: 7, total: 10 } }}`.
 *
 * Impure on purpose. A pure pipe caches against its argument, and the argument
 * here is a constant key - switching language would change every string on the
 * page while the pipe kept handing back the first answer it gave. Reading the
 * strings through a signal is what marks the host for re-render, so the two
 * work together: the signal says when, the impure pipe does the work.
 *
 * The cost is a dictionary lookup per binding per change detection run.
 */
@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly _i18n = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this._i18n.t(key, params);
  }
}
