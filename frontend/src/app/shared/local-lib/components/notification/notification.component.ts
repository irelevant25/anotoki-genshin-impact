import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, NotificationType, Notification } from './notification.service';

@Component({
  selector: 'app-notification',
  imports: [FormsModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent {
  notifications: Notification[] = [];
  notificationType = NotificationType;

  // When true and more than one notification is active, they collapse into a
  // visual stack. Hovering the container expands them to the normal layout.
  stackable = true;

  private _unsubscriber = new Subject<void>();

  constructor(
    private _notificationService: NotificationService,
    private readonly _cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this._notificationService.notifications$.pipe(takeUntil(this._unsubscriber)).subscribe((notifications) => {
      this.notifications = notifications;
      this._cd.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  dismiss(id: string): void {
    this._notificationService.dismiss(id);
  }

  trackByFn(index: number, item: Notification): string {
    return item.id;
  }
}
