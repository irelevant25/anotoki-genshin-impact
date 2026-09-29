import { Component, Injectable, output, inject, model } from '@angular/core';
import { CustomModalRef } from './modal-core/modal-core.class';

import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  imports: [ButtonComponent],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
@Injectable()
export class ModalComponent {
  title = model<string | undefined>(undefined);
  subtitle = model<string | undefined>(undefined);
  class = model<string | undefined>(undefined);
  disabled = model<boolean>(false);

  /**
   * Whether the corner cross is drawn.
   *
   * False for the handful of modals that are a gate rather than a window - the
   * forced password change, where there is nothing behind this to go back to
   * and offering a way out would only be offering a broken page. Set it
   * alongside `backdrop: 'static'` and `keyboard: false` on the open() call,
   * or the cross is gone while Escape still works.
   */
  dismissable = model<boolean>(true);

  closeModal = output<void>();

  readonly modalRef = inject(CustomModalRef);

  close(): void {
    this.modalRef.close();
  }

  dismiss(): void {
    this.modalRef.dismiss();
  }

  closeDialog(): void {
    this.closeModal.emit();
  }
}
