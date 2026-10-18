import { Injectable } from '@angular/core';

/** What every item this service keeps starts with, in this browser's localStorage (the Privacy page names them by it). */
export const LOCAL_STORAGE_PREFIX = 'anotoki-genshin-impact-';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly _appName: string = LOCAL_STORAGE_PREFIX;

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
