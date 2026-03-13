import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly _appName: string = 'anotoki-genshin-impact-';

  public read(key: string): string | null {
    return localStorage.getItem(this._appName + key);
  }

  public write(key: string, value?: string): boolean {
    try {
      if (value !== undefined && value !== null) {
        localStorage.setItem(this._appName + key, value);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(this._appName + key);
  }

  public clear(): void {
    localStorage.clear();
  }
}
