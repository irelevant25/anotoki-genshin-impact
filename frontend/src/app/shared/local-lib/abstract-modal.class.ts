import { Directive, effect, ElementRef, inject, model, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnotokiDialog, AnotokiDialogOptions, AnotokiDialogRef } from '@anotoki/lib/ui/dialog';
import { ToastService } from '@anotoki/lib/ui/toast';
import { Subject } from 'rxjs';

/**
 * What a page that opens dialogs, or a component drawn in one, shares.
 *
 * The dialogs are the anotoki kit's (@anotoki/lib/ui/dialog): `openModal()`
 * draws a component in one - the focus inside, Escape and the backdrop asking
 * it to close, the focus back where it was afterwards - and hands it what it
 * needs as `data` (ANOTOKI_DIALOG_DATA). The component drawn there closes it
 * with `closeModal(true)` when something was saved, which runs the opener's
 * `onModalSuccess()` (or the function it passed); dismissed, nothing runs.
 */
@Directive({})
export abstract class AbstractModalComponent {
  loading = model<boolean>(false);

  protected readonly unsubscriber = new Subject<void>();
  /** The dialog this component is drawn in, when it is one. */
  protected readonly dialogRef = inject(AnotokiDialogRef, { optional: true });
  protected readonly dialogs = inject(AnotokiDialog);
  protected readonly notificationService = inject(ToastService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly elementRef = inject(ElementRef);

  ngOnDestroy(): void {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  /** Closes the dialog this component is drawn in; `success` tells whoever opened it to reload. */
  closeModal(success: boolean = false): void {
    this.dialogRef?.close(success);
  }

  /**
   * Opens `component` in a dialog. Its result settles `closed`; a truthy one
   * runs `successFunction`, or this page's `onModalSuccess()`.
   */
  openModal<R = unknown, D = unknown>(component: Type<unknown>, options: AnotokiDialogOptions<D> = {}, successFunction?: () => void): AnotokiDialogRef<R> {
    const ref = this.dialogs.open<unknown, R, D>(component, options);
    void ref.closed.then((result) => {
      if (result) {
        if (successFunction) {
          successFunction();
        } else {
          this.onModalSuccess();
        }
      }
    });
    return ref;
  }

  /**
   * The heading of the dialog this component is drawn in, following `source`
   * (a translated or changing title). Call it where `inject()` works - a field
   * or the constructor.
   */
  protected dialogHeading(source: () => string): void {
    effect(() => this.dialogRef?.heading.set(source()));
  }

  protected onModalSuccess(): void {
    // Override in child classes to implement specific refresh logic
  }
}
