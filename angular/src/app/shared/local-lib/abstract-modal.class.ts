import { ChangeDetectorRef, Directive, inject, model, Type } from '@angular/core';
import { ModalService } from './components/modal/modal.service';
import { CustomModalRef, ModalConfig } from './components/modal/modal-core/modal-core.class';
import { Subject, takeUntil } from 'rxjs';

@Directive({})
export abstract class AbstractModalComponent {
  loading = model<boolean>(false);
  isModalOpen: boolean = false;

  protected readonly cd = inject(ChangeDetectorRef);
  protected readonly unsubscriber = new Subject<void>();
  protected readonly modalRef = inject(CustomModalRef, { optional: true });
  protected readonly modalService = inject(ModalService);

  ngOnDestroy(): void {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  closeModal(success: boolean = false): void {
    this.modalRef?.close(success);
  }

  openModal<T, R = any>(component: Type<T>, config: ModalConfig = { size: '2' }, successFunction?: () => void): CustomModalRef<T, R> {
    this.isModalOpen = true;
    const modal = this.modalService.open(component, config);
    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((toReload) => {
      if (toReload) {
        if (successFunction) {
          successFunction();
        } else {
          this.onModalSuccess();
        }
      }
      setTimeout(() => {
        this.isModalOpen = false;
      });
    });
    return modal;
  }

  protected onModalSuccess(): void {
    // Override in child classes to implement specific refresh logic
  }
}
