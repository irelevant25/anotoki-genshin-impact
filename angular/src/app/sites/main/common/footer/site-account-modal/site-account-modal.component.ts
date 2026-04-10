import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { SecurityService, UserInfo } from '../../../../../shared/local-lib/services/security.service';
import { AbstractDetailComponent } from '../../../../../shared/local-lib/abstract-detail.class';
import { Observable, of } from 'rxjs';
import { ButtonComponent } from "../../../../../shared/local-lib/components/button/button.component";
import { LoaderComponent } from "../../../../../shared/local-lib/components/loader/loader.component";

@Component({
  selector: 'app-site-account-modal',
  templateUrl: './site-account-modal.component.html',
  styleUrls: ['./site-account-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, ButtonComponent, LoaderComponent],
  providers: [],
})
export class SiteAccountModalComponent extends AbstractDetailComponent<any> {
  userData: UserInfo | null = null;

  constructor(private readonly _securityService: SecurityService) {
    super();
    this._securityService.currentUserData$.subscribe(data => {
      if (!data) {
        return;
      }
      this.userData = data;
      console.log('User data updated:', this.userData);
    });
  }

  protected override loadData$(): Observable<any> {
    return of(null);
  }

  logout(): void {
    this.loading.set(true);
    this._securityService.logout((isSuccess) => {
      this.loading.set(false);
      this.loadingElement?.loadingCtrl.loading$.subscribe(loading => {
        if (!loading && isSuccess) {
          this.closeModal(true);
        }
      });
    });
  }

  toAdmin(): void {
    window.open('/admin', '_blank');
  }
}
