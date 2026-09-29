import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // in milliseconds, undefined means no auto-dismiss
  dismissible?: boolean;
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _notifications = new BehaviorSubject<Notification[]>([]);
  public readonly notifications$: Observable<Notification[]> = this._notifications.asObservable();

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addNotification(notification: Notification): void {
    this._notifications.next([...this._notifications.value, notification]);
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  public showSuccess(message: string, duration: number = 10_000, dismissible: boolean = true): void {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.SUCCESS,
      message,
      duration,
      dismissible,
    };
    this.addNotification(notification);
  }

  public showError(message: string, duration: number = 30_000, dismissible: boolean = true): void {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.ERROR,
      message,
      duration, // Error notifications typically don't auto-dismiss
      dismissible,
    };
    this.addNotification(notification);
  }

  public showInfo(message: string, duration: number = 15_000, dismissible: boolean = true): void {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.INFO,
      message,
      duration,
      dismissible,
    };
    this.addNotification(notification);
  }

  public showWarning(message: string, duration: number = 20_000, dismissible: boolean = true): void {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.WARNING,
      message,
      duration,
      dismissible,
    };
    this.addNotification(notification);
  }

  public dismiss(id: string): void {
    const currentNotifications = this._notifications.value;
    const filteredNotifications = currentNotifications.filter((n) => n.id !== id);
    this._notifications.next(filteredNotifications);
  }

  public dismissAll(): void {
    this._notifications.next([]);
  }
}
