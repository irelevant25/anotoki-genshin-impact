import { Component, model } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/local-lib/components/modal/modal.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { FieldsComponent } from '../../../../../shared/local-lib/abstract-fields.class';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { PasswordComponent } from '../../../../../shared/local-lib/components/password/password.component';
import { LoaderComponent } from "../../../../../shared/local-lib/components/loader/loader.component";
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';

interface ILogin {
  email: string;
  password: string;
}

@Component({
  selector: 'app-site-login-modal',
  templateUrl: './site-login-modal.component.html',
  styleUrls: ['./site-login-modal.component.scss'],
  imports: [ModalComponent, ReactiveFormsModule, TextComponent, ButtonComponent, PasswordComponent, LoaderComponent, TranslatePipe],
  providers: [],
})
export class SiteLoginModalComponent extends FieldsComponent<ILogin> {
  form: ILogin = {
    email: '',
    password: '',
  };

  constructor(private readonly _securityService: SecurityService) {
    super();
  }

  override submit(): void {
    super.submit(this._securityService.login(this.form.email, this.form.password), {
      success: 'Login was successful.',
      error: 'Login failed.',
    });
  }

  cancel(): void {
    this.closeModal(false);
  }
}
