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
  class = model<string | undefined>(undefined);
  disabled = model<boolean>(false);

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
