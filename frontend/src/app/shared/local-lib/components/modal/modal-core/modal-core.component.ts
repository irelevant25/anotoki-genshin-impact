import { Component, ElementRef, HostListener, ViewChild, ComponentRef, ViewContainerRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomModalRef, ModalDismissReasons, ModalOptions } from './modal-core.class';

@Component({
  selector: 'app-modal-core',
  imports: [CommonModule],
  templateUrl: './modal-core.component.html',
  styleUrls: ['./modal-core.component.scss'],
})
export class ModalCoreComponent {
  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  contentContainer!: ViewContainerRef;

  @ViewChild('modalDialog', { static: true })
  modalDialog!: ElementRef;

  // Signals, not plain fields: the app runs zoneless, and both of these are set
  // asynchronously - `isShown` from a timeout, `options` from ModalRef.update().
  // As plain fields nothing would schedule the render that applies `.show`.
  readonly isShown = signal(false);
  readonly options = signal<ModalOptions>({});
  modalRef!: CustomModalRef;
  contentComponentRef!: ComponentRef<any>;

  private _focusedElementBeforeModal: HTMLElement | null = null;

  ngOnInit(): void {
    // Store the currently focused element
    this._focusedElementBeforeModal = document.activeElement as HTMLElement;

    // Show modal after a brief delay for animation
    setTimeout(() => {
      this.isShown.set(true);
      this.focusModal();
      this.modalRef._notifyShown();
    }, 10);
  }

  ngOnDestroy(): void {
    // Restore focus to the previously focused element
    if (this._focusedElementBeforeModal) {
      this._focusedElementBeforeModal.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.options().keyboard !== false) {
      this.modalRef.dismiss(ModalDismissReasons.ESC);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && this.options().backdrop !== 'static') {
      if (this.options().backdrop !== false) {
        this.modalRef.dismiss(ModalDismissReasons.BACKDROP_CLICK);
      }
    }
  }

  updateOptions(options: ModalOptions): void {
    this.options.update((current) => ({ ...current, ...options }) satisfies ModalOptions);
  }

  getModalSizeClass(): string {
    const size = this.options().size;
    if (!size) {
      return '';
    }

    return `modal-${size}`;
  }

  private focusModal(): void {
    const modalElement = this.modalDialog.nativeElement;
    if (modalElement) {
      modalElement.focus();
    }
  }
}
