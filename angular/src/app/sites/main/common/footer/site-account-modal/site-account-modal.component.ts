import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';
import { AbstractDetailComponent } from '../../../../../shared/local-lib/abstract-detail.class';
import { Observable, of } from 'rxjs';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractDetailComponent<any> {
  userData: UserInfo | null = null;

  constructor(private readonly _securityService: SecurityService) {
    super();
    this._securityService.currentUserData$.subscribe(data => {
      this.userData = data;
      console.log('User data updated:', this.userData);
    });
  }

  protected override loadData$(): Observable<any> {
    return of();
  }

  logout(): void {
    this._securityService.logout();
    this.notificationService.showSuccess('You was successfully logged out.');
  }

  toAdmin(): void {
    window.open('/admin', '_blank');
  }
}
