import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppSessionStorageService {
  private readonly _appName: string = 'usi-';

  public read(key: string): string | null {
    return sessionStorage.getItem(this._appName + key);
  }

  public write(key: string, value?: string): void {
    if (value !== undefined && value !== null) {
      sessionStorage.setItem(this._appName + key, value);
    }
  }

  public remove(key: string): void {
    sessionStorage.removeItem(this._appName + key);
  }

  public clear(): void {
    sessionStorage.clear();
  }
}
