import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface AppConfig {
  url: string;
  configuration: 'dev' | 'test' | 'prod';
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly _configLoadedSubject = new BehaviorSubject<boolean>(false);
  public configLoaded$ = this._configLoadedSubject.asObservable();
  config?: AppConfig;

  constructor(private readonly _http: HttpClient) { }

  async init(): Promise<void> {
    try {
      // Load config.json from assets at runtime
      const jsonConfig = await firstValueFrom(this._http.get<AppConfig>('./config.json'));
      this.config = jsonConfig;
      this._configLoadedSubject.next(true);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this._configLoadedSubject.next(false);
      throw error;
    }
  }

  get isDev(): boolean {
    if (!this.config) {
      console.warn('Config is not loaded yet. Returning false for isDev check.');
      return false;
    }
    return this.config.configuration.toLowerCase() === 'dev';
  }

  get isTest(): boolean {
    if (!this.config) {
      console.warn('Config is not loaded yet. Returning false for isTest check.');
      return false;
    }
    return this.config.configuration.toLowerCase() === 'test';
  }

  get isProd(): boolean {
    if (!this.config) {
      console.warn('Config is not loaded yet. Returning false for isProd check.');
      return false;
    }
    return this.config.configuration.toLowerCase() === 'prod';
  }

  get backendUrl(): string | undefined {
    return this.config?.url;
  }
}
