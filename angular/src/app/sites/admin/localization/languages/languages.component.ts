import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageApiService, Language } from '../../../../api';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';

/** English is the fallback for every other language, so it is not removable. */
const FALLBACK_LANGUAGE = 'en';

interface DraftLanguage {
  code: string;
  name: string;
  native_name: string;
}

/**
 * The languages the site offers.
 *
 * Adding one here makes it appear in the site's chooser straight away, reading
 * entirely in English until it is translated - which is better than not
 * appearing at all while somebody works through the strings.
 */
@Component({
  selector: 'app-admin-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss'],
  imports: [FormsModule, ButtonComponent, LoaderComponent],
})
export class LanguagesComponent implements OnInit {
  private readonly _languageApi = inject(LanguageApiService);
  private readonly _notify = inject(NotificationService);

  readonly languages = signal<Language[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleteConfirm = signal<string | null>(null);

  readonly draft = signal<DraftLanguage>({ code: '', name: '', native_name: '' });

  readonly fallback = FALLBACK_LANGUAGE;

  readonly canAdd = computed(() => {
    const draft = this.draft();
    return /^[a-z]{2}(-[a-z]{2})?$/.test(draft.code.trim().toLowerCase()) && !!draft.name.trim() && !!draft.native_name.trim();
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Disabled languages included: this page is where they are switched back on.
    this._languageApi.getLanguages({ all: 1 }).subscribe({
      next: (languages) => {
        this.languages.set(languages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Failed to load languages');
      },
    });
  }

  updateDraft(field: keyof DraftLanguage, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  add(): void {
    if (!this.canAdd()) {
      return;
    }
    const draft = this.draft();
    this.saving.set(true);
    this._languageApi
      .createLanguage({
        code: draft.code.trim().toLowerCase(),
        name: draft.name.trim(),
        native_name: draft.native_name.trim(),
      })
      .subscribe({
        next: () => {
          this.draft.set({ code: '', name: '', native_name: '' });
          this.saving.set(false);
          this.load();
          this._notify.showSuccess('Language added. It reads in English until it is translated.');
        },
        error: (e) => {
          this.saving.set(false);
          this._notify.showError(e?.error?.error ?? 'Failed to add language');
        },
      });
  }

  rename(language: Language, field: 'name' | 'native_name', value: string): void {
    const trimmed = value.trim();
    if (!trimmed || trimmed === language[field]) {
      return;
    }
    this._languageApi.updateLanguage(language.code, { [field]: trimmed }).subscribe({
      next: () => this.load(),
      error: (e) => {
        this.load();
        this._notify.showError(e?.error?.error ?? 'Failed to save');
      },
    });
  }

  reorder(language: Language, value: string): void {
    const order = Number(value);
    if (!Number.isFinite(order) || order === language.sort_order) {
      return;
    }
    this._languageApi.updateLanguage(language.code, { sort_order: order }).subscribe({
      next: () => this.load(),
      error: (e) => {
        this.load();
        this._notify.showError(e?.error?.error ?? 'Failed to save');
      },
    });
  }

  toggleEnabled(language: Language): void {
    this._languageApi.updateLanguage(language.code, { enabled: !language.enabled }).subscribe({
      next: () => {
        this.load();
        this._notify.showSuccess(language.enabled ? `${language.name} hidden from the site` : `${language.name} is now offered on the site`);
      },
      error: (e) => {
        this.load();
        this._notify.showError(e?.error?.error ?? 'Failed to save');
      },
    });
  }

  confirmDelete(code: string): void {
    this.deleteConfirm.set(code);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(code: string): void {
    this._languageApi.deleteLanguage(code).subscribe({
      next: (result) => {
        this.deleteConfirm.set(null);
        this.load();
        const moved = result?.users_moved ? `, ${result.users_moved} reader(s) moved to English` : '';
        this._notify.showSuccess(`Deleted with ${result?.translations_deleted ?? 0} translation(s)${moved}`);
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this._notify.showError(e?.error?.error ?? 'Failed to delete');
      },
    });
  }
}
