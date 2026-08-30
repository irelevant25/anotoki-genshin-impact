import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, Type, DOCUMENT } from '@angular/core';

import { Inject } from '@angular/core';
import { CustomModalRef, ModalConfig, ModalOptions } from './modal-core/modal-core.class';
import { ModalCoreComponent } from './modal-core/modal-core.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _openModals: CustomModalRef[] = [];

  constructor(
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _appRef: ApplicationRef,
    private _injector: Injector,
    @Inject(DOCUMENT) private _document: Document,
  ) {}

  open<T, R = any>(component: Type<T>, config: ModalConfig = {}): CustomModalRef<T, R> {
    // Default options
    const options: ModalOptions = {
      backdrop: true,
      keyboard: true,
      size: undefined,
      backdropClass: '',
      maxWidth: undefined,
      centered: false,
      animation: true,
      scrollable: true,
      fullWidth: false,
      ...config,
    };

    // Create modal container
    const containerFactory = this._componentFactoryResolver.resolveComponentFactory(ModalCoreComponent);
    const containerRef = containerFactory.create(this._injector);

    // Create modal reference first
    const modalRef = new CustomModalRef<T, R>(null as any, containerRef, options);

    // Create injector that provides the modal reference
    const modalInjector = Injector.create({
      providers: [{ provide: CustomModalRef, useValue: modalRef }],
      parent: config.injector || this._injector,
    });

    // Create the content component with the modal reference injected
    const contentFactory = this._componentFactoryResolver.resolveComponentFactory(component);
    const contentRef = contentFactory.create(modalInjector);

    // Update the modal reference with the content component ref
    modalRef._setComponentRef(contentRef);

    // Setup container
    containerRef.instance.options.set(options);
    containerRef.instance.modalRef = modalRef;
    containerRef.instance.contentComponentRef = contentRef;

    // Insert content component into container
    containerRef.instance.contentContainer.insert(contentRef.hostView);

    // Attach container to the DOM
    this._appRef.attachView(containerRef.hostView);
    const containerElement = (containerRef.hostView as any).rootNodes[0] as HTMLElement;
    this._document.body.appendChild(containerElement);

    // Track the modal
    this._openModals.push(modalRef);

    // Handle modal close/dismiss
    modalRef.closed.subscribe(() => {
      this.removeModal(modalRef);
    });

    return modalRef;
  }

  dismissAll(reason?: any): void {
    this._openModals.slice().forEach((modal) => modal.dismiss(reason));
  }

  get hasOpenModals(): boolean {
    return this._openModals.length > 0;
  }

  getOpenModals(): CustomModalRef[] {
    return [...this._openModals];
  }

  private removeModal(modalRef: CustomModalRef): void {
    const index = this._openModals.indexOf(modalRef);
    if (index > -1) {
      this._openModals.splice(index, 1);
    }
  }
}
