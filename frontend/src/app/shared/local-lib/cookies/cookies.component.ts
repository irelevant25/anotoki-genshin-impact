import { ChangeDetectorRef, Component } from '@angular/core';
import { ButtonComponent } from '../components/button/button.component';
import { Subject } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-cookies',
  imports: [ButtonComponent],
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.scss',
})
export class CookiesComponent {
  protected readonly _unsubscriber = new Subject<void>();

  hideBar: boolean = true;

  constructor(
    private readonly _storageService: LocalStorageService,
    private readonly _cd: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    // const prijatNevyhnutne = this._storageService.read('cookies-prijat-nevyhnutne') === 'true';
    // const prijatVsetko = this._storageService.read('cookies-prijat-vsetko') === 'true';
    this.hideBar = !this.isCookiesExpired;
    this._cd.detectChanges();
  }

  prijatNevyhnutne(): void {
    // this._notificationService.showWarning(`Táto funkcionalita je aktuálne vo vývoji a bude dostupná čoskoro.`);
    // this._storageService.write('cookies-prijat-nevyhnutne', 'true');
    this.closeCookiesBar(false);
  }

  prijatVsetko(): void {
    // this._notificationService.showWarning(`Táto funkcionalita je aktuálne vo vývoji a bude dostupná čoskoro.`);
    // this._storageService.write('cookies-prijat-vsetko', 'true');
    this.closeCookiesBar(false);
  }

  get isCookiesExpired(): boolean {
    const expiration = this._storageService.read('cookies-expiration');
    if (!expiration) {
      return true;
    }
    return new Date(expiration) < new Date();
  }

  closeCookiesBar(closeOnly: boolean): void {
    const today = new Date();
    if (closeOnly) {
      // + 1 hour
      today.setHours(today.getHours() + 1);
    } else {
      // + 1 day
      today.setDate(today.getDate() + 1);
    }
    this._storageService.write('cookies-expiration', today.toUTCString());
    this.hideBar = true;
  }
}
