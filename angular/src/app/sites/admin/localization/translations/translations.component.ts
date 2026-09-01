import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationApiService, Language, TranslationAdminView, TranslationSite } from '../../../../api';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';

const FALLBACK_LANGUAGE = 'en';

interface GridRow {
  name: string;
  description: string | null;
  site: string;
  values: Record<string, string>;
}

/**
 * Every string the site says, in every language it says it in.
 *
 * Edits are held until Save so a half-finished pass is not published a
 * keystroke at a time. Clearing a box is a real action - it deletes the
 * translation, and that key falls back to English again.
 */
@Component({
  selector: 'app-admin-translations',
  templateUrl: './translations.component.html',
  styleUrls: ['./translations.component.scss'],
  imports: [FormsModule, ButtonComponent, LoaderComponent],
})
export class TranslationsComponent implements OnInit {
  private readonly _translationApi = inject(TranslationApiService);
  private readonly _notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly saving = signal(false);

  private readonly _grid = signal<TranslationAdminView | null>(null);
  /** Pending changes, as key -> language code -> text. */
  private readonly _edits = signal<Record<string, Record<string, string>>>({});

  readonly filter = signal('');
  /** When set to a language code, shows only what that language is missing. */
  readonly missingIn = signal('');
  readonly showDescriptions = signal(false);

  readonly newKey = signal('');
  /** Which scope a new key lands in; defaults to shared. */
  readonly newKeySite = signal('common');
  readonly deleteConfirm = signal<string | null>(null);

  /** Show only one scope, for working through a single site's strings. */
  readonly siteFilter = signal('');

  readonly fallback = FALLBACK_LANGUAGE;

  readonly languages = computed<Language[]>(() => this._grid()?.languages ?? []);
  readonly sites = computed<TranslationSite[]>(() => this._grid()?.sites ?? []);
  /** The site this admin panel belongs to, which is the interesting one. */
  readonly currentSite = computed(() => this._grid()?.currentSite ?? '');

  /** A key another site owns is listed but not editable from here. */
  isForeign(row: GridRow): boolean {
    return row.site !== 'common' && row.site !== this.currentSite();
  }

  siteLabel(code: string): string {
    return this.sites().find((site) => site.code === code)?.name ?? code;
  }

  readonly rows = computed<GridRow[]>(() => {
    const grid = this._grid();
    if (!grid) {
      return [];
    }

    const needle = this.filter().trim().toLowerCase();
    const missingIn = this.missingIn();

    return grid.keys.filter((row) => {
      if (missingIn && this._stored(row, missingIn)) {
        return false;
      }
      if (this.siteFilter() && row.site !== this.siteFilter()) {
        return false;
      }
      if (!needle) {
        return true;
      }
      // Search the key, the note and every translation of it: someone
      // hunting for a string on the page knows the text, not the key.
      if (row.name.toLowerCase().includes(needle) || (row.description ?? '').toLowerCase().includes(needle)) {
        return true;
      }
      return Object.values(row.values).some((value) => value.toLowerCase().includes(needle));
    });
  });

  readonly dirtyCount = computed(() =>
    Object.values(this._edits()).reduce((total, byLanguage) => total + Object.keys(byLanguage).length, 0),
  );

  /** How much of each language is done, so gaps are visible without hunting. */
  readonly coverage = computed(() => {
    const grid = this._grid();
    if (!grid) {
      return [];
    }
    const total = grid.keys.length;
    return grid.languages.map((language) => {
      const done = grid.keys.filter((row) => this._stored(row, language.code)).length;
      return {
        ...language,
        done,
        total,
        percent: total ? Math.round((100 * done) / total) : 0,
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._translationApi.getAdminTranslations().subscribe({
      next: (grid) => {
        this._grid.set(grid);
        this._edits.set({});
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Failed to load translations');
      },
    });
  }

  // ── Editing ────────────────────────────────────────────────────────────────

  /** What to show in a box: the pending edit if there is one, else what is stored. */
  valueOf(row: GridRow, code: string): string {
    const edit = this._edits()[row.name]?.[code];
    return edit !== undefined ? edit : (row.values[code] ?? '');
  }

  isEdited(key: string, code: string): boolean {
    return this._edits()[key]?.[code] !== undefined;
  }

  setValue(row: GridRow, code: string, value: string): void {
    const stored = row.values[code] ?? '';

    this._edits.update((edits) => {
      const forKey = { ...(edits[row.name] ?? {}) };

      if (value === stored) {
        // Typed back to where it started, so there is nothing to save.
        delete forKey[code];
      } else {
        forKey[code] = value;
      }

      const next = { ...edits };
      if (Object.keys(forKey).length) {
        next[row.name] = forKey;
      } else {
        delete next[row.name];
      }
      return next;
    });
  }

  discard(): void {
    this._edits.set({});
  }

  save(): void {
    const edits = this._edits();
    if (!Object.keys(edits).length) {
      return;
    }

    this.saving.set(true);
    this._translationApi.saveAdminTranslations({ values: edits }).subscribe({
      next: (result) => {
        this.saving.set(false);
        const cleared = result.cleared ? `, ${result.cleared} cleared` : '';
        this._notify.showSuccess(`Saved ${result.written} translation(s)${cleared}`);
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this._notify.showError(e?.error?.errors?.join('; ') ?? e?.error?.error ?? 'Failed to save');
      },
    });
  }

  // ── Keys ───────────────────────────────────────────────────────────────────

  addKey(): void {
    const name = this.newKey().trim();
    if (!name) {
      return;
    }
    this._translationApi.createTranslationKey({ name, site: this.newKeySite(), description: null }).subscribe({
      next: () => {
        this.newKey.set('');
        this.load();
        this._notify.showSuccess(`Added ${name}. Give it an English value or it will render as its own key.`);
      },
      error: (e) => this._notify.showError(e?.error?.error ?? 'Failed to add key'),
    });
  }

  saveDescription(row: GridRow, description: string): void {
    if ((row.description ?? '') === description.trim()) {
      return;
    }
    this._translationApi.updateTranslationKey(row.name, { description: description.trim() || null }).subscribe({
      next: () => this.load(),
      error: (e) => this._notify.showError(e?.error?.error ?? 'Failed to save the note'),
    });
  }

  /** Moving a key between scopes, which changes which sites can load it. */
  setSite(row: GridRow, site: string): void {
    if (site === row.site) {
      return;
    }
    this._translationApi.updateTranslationKey(row.name, { site }).subscribe({
      next: () => this.load(),
      error: (e) => this._notify.showError(e?.error?.error ?? 'Failed to move the key'),
    });
  }

  confirmDelete(name: string): void {
    this.deleteConfirm.set(name);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  deleteKey(name: string): void {
    this._translationApi.deleteTranslationKey(name).subscribe({
      next: (result) => {
        this.deleteConfirm.set(null);
        this.load();
        this._notify.showSuccess(`Deleted with ${result?.translations_deleted ?? 0} translation(s)`);
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this._notify.showError(e?.error?.error ?? 'Failed to delete');
      },
    });
  }

  // ── JSON in and out ────────────────────────────────────────────────────────

  /** Bulk work is easier in a text editor, so a language can leave and return. */
  exportLanguage(code: string): void {
    this._translationApi.exportTranslations(code).subscribe({
      next: (values) => {
        const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `translations-${code}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (e) => this._notify.showError(e?.error?.error ?? 'Failed to export'),
    });
  }

  importLanguage(code: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Cleared straight away so importing the same file twice still fires.
    input.value = '';
    if (!file) {
      return;
    }

    file
      .text()
      .then((text) => {
        const values = JSON.parse(text);
        if (!values || typeof values !== 'object' || Array.isArray(values)) {
          throw new Error('not an object');
        }
        this._translationApi.importTranslations(code, { values }).subscribe({
          next: (result) => {
            this._notify.showSuccess(`Imported ${result.written} string(s)`);
            this.load();
          },
          error: (e) => {
            const unknown = e?.error?.unknown as string[] | undefined;
            this._notify.showError(
              unknown?.length
                ? `The file has ${unknown.length} key(s) the site does not have: ${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? '…' : ''}`
                : (e?.error?.error ?? 'Failed to import'),
            );
          },
        });
      })
      .catch(() => this._notify.showError(`${file.name} is not a JSON object of key to text`));
  }

  private _stored(row: GridRow, code: string): boolean {
    return !!row.values[code];
  }
}
