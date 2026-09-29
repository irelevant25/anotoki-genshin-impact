import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ModalOptions {
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  size?: '1' | '2' | '3' | '4' | '5' | '6';
  maxWidth?: string;
  backdropClass?: string;
  centered?: boolean;
  animation?: boolean;
  scrollable?: boolean;
  fullWidth?: boolean;
}

export interface ModalConfig extends ModalOptions {
  injector?: any;
}

export abstract class ModalRef<T = any, R = any> {
  abstract componentInstance: T;
  abstract closed: Observable<R>;

  abstract close(result?: R): void;
  abstract dismiss(reason?: any): void;
  abstract update(options: Partial<ModalOptions>): void;
  abstract shown: Observable<void>;
  abstract hidden: Observable<void>;
}

export enum ModalDismissReasons {
  BACKDROP_CLICK = 'backdrop-click',
  ESC = 'esc',
  CLOSE = 'close',
}

export class CustomModalRef<T = any, R = any> extends ModalRef<T, R> {
  private _closed = new Subject<R>();
  private _shown = new Subject<void>();
  private _hidden = new Subject<void>();

  public componentInstance: T;

  constructor(
    componentRef: ComponentRef<any> | null,
    private _containerRef: ComponentRef<any>,
    public options: ModalOptions = {},
  ) {
    super();
    this.componentInstance = componentRef?.instance;
  }

  get closed(): Observable<R> {
    return this._closed.asObservable();
  }

  get shown(): Observable<void> {
    return this._shown.asObservable();
  }

  get hidden(): Observable<void> {
    return this._hidden.asObservable();
  }

  close(result?: R): void {
    this._closed.next(result as R);
    this._destroy();
  }

  dismiss(reason?: any): void {
    // For dismiss, we still emit through closed but with the reason
    // You could also create a separate dismissed observable if needed
    this._closed.next(reason);
    this._destroy();
  }

  update(options: Partial<ModalOptions>): void {
    this.options = { ...this.options, ...options } satisfies ModalOptions;
    // Apply updated options to the modal container
    if (this._containerRef.instance.updateOptions) {
      this._containerRef.instance.updateOptions(this.options);
    }
  }

  _notifyShown(): void {
    this._shown.next();
  }

  _notifyHidden(): void {
    this._hidden.next();
    this._hidden.complete();
    this._shown.complete();
    this._closed.complete();
  }

  _setComponentRef(componentRef: ComponentRef<any>): void {
    this.componentInstance = componentRef.instance;
  }

  private _destroy(): void {
    if (this._containerRef) {
      this._containerRef.destroy();
    }
    this._notifyHidden();
  }
}
