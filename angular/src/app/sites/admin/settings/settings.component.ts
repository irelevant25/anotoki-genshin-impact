import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSiteSetting, Language, LanguageApiService, SettingApiService, SiteSettingChange } from '../../../api';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';
import { AppDatePipe } from '../../../shared/local-lib/pipes/date.pipe';
import { SWITCHABLE_SECTIONS } from '../../../shared/routing-definition';

/** A group of switches, under one heading. */
interface SettingGroup {
  readonly key: string;
  readonly title: string;
  readonly note: string;
  readonly settings: AdminSiteSetting[];
}

/** The words for one switch. */
interface SettingWords {
  readonly label: string;
  readonly help: string;
}

/**
 * What each switch is called, and what it does.
 *
 * In the template's own language rather than in the translation table, like
 * every other page in this panel: the admin site is English only, and thirty
 * keys nothing would ever read in a second language are thirty keys somebody
 * has to skip past in the translation editor.
 *
 * A setting with no entry here still appears and is still editable, under its
 * own name. That is the point of the form being generic - a switch added in a
 * migration is usable before anybody writes a sentence about it.
 */
const WORDS: Record<string, SettingWords> = {
  maintenance_mode: {
    label: 'Maintenance mode',
    help: 'Shows the maintenance page instead of the site, and the API refuses everything but signing in. Admins see the site as usual — and can always sign in at /staff, which is how you get back in after switching this on.',
  },
  maintenance_message: {
    label: 'What the maintenance page says',
    help: 'One message per language. A language left empty falls back to English, and English left empty falls back to the built-in sentence — the page is never blank.',
  },
  login_enabled: {
    label: 'Signing in',
    help: 'Off closes every way in — password, emailed code, Google, confirmation links and password resets — for everybody but admins, and takes the sign-in and register buttons off the site. /staff still has them.',
  },
  google_login_enabled: {
    label: 'Google sign-in',
    help: 'Off hides the Google button and refuses Google tokens, admins included. An account with no password and only Google attached cannot get in while this is off.',
  },
  announcement_enabled: {
    label: 'Show the announcement',
    help: 'Puts the message below across the top of every page. A reader can dismiss it, and it stays dismissed for them until the wording changes.',
  },
  announcement_level: {
    label: 'Kind',
    help: 'Decides how the bar is coloured.',
  },
  announcement_message: {
    label: 'Message',
    help: 'One per language. A language left empty falls back to English; with English empty too, nothing is drawn whatever the switch above says.',
  },
  disabled_routes: {
    label: 'Switched-off sections',
    help: 'A section that is off disappears from the menu and its pages answer as if they had never been written. This is the site, not the API: it is for a part of the site that is not ready, not for locking anything down.',
  },
};

/** The heading and the one-liner above each group. */
const GROUPS: Record<string, { title: string; note: string }> = {
  access: {
    title: 'Getting in',
    note: 'Who can reach the site, and how they sign in to it.',
  },
  notice: {
    title: 'Announcement',
    note: 'A line across the top of every page, for when one thing has to reach everybody at once.',
  },
  routes: {
    title: 'Parts of the site',
    note: 'Which sections exist this week.',
  },
};

/** What the sections are called on the site, for the checkboxes. */
const SECTION_LABELS: Record<string, string> = {
  daily: 'Daily',
  quizzes: 'Quizzes',
  games: 'Games',
  database: 'Database',
  profile: 'Profile',
};

/**
 * The switches an admin can throw without a deploy.
 *
 * The form is drawn from what the API returns rather than written out control
 * by control: each row carries a declared type, and there is one control per
 * type. Adding a setting is a row in a migration and, if it deserves a
 * sentence, an entry in WORDS above.
 *
 * Everything is saved in one request. Maintenance mode and the words on the
 * maintenance page are one decision, and saving them separately would leave a
 * window — however short — where the site is closed and the sign is blank.
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [FormsModule, ButtonComponent, LoaderComponent, AppDatePipe],
})
export class SettingsComponent implements OnInit {
  private readonly _settingApi = inject(SettingApiService);
  private readonly _languageApi = inject(LanguageApiService);
  private readonly _notify = inject(NotificationService);

  readonly settings = signal<AdminSiteSetting[]>([]);
  readonly languages = signal<Language[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly failed = signal(false);

  /**
   * The form, as the values that would be sent.
   *
   * Every setting's value is text in the table, so the draft is text too and
   * the controls parse in and out of it. One shape in, one shape out, and
   * nothing to keep in step.
   */
  readonly draft = signal<Record<string, string>>({});

  readonly sections = SWITCHABLE_SECTIONS;

  readonly groups = computed<SettingGroup[]>(() => {
    const groups: SettingGroup[] = [];

    for (const setting of this.settings()) {
      let group = groups.find((candidate) => candidate.key === setting.group_name);

      if (!group) {
        const words = GROUPS[setting.group_name] ?? { title: setting.group_name, note: '' };
        group = { key: setting.group_name, title: words.title, note: words.note, settings: [] };
        groups.push(group);
      }

      group.settings.push(setting);
    }

    return groups;
  });

  /** Which settings the form would send, which is also whether Save does anything. */
  readonly changed = computed(() => this.settings().filter((setting) => this.draft()[setting.name] !== (setting.value ?? '')));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);

    this._settingApi.getSettings().subscribe({
      next: (list) => {
        this._adopt(list.settings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });

    // Only the enabled ones: a message written in a language nobody can read
    // the site in is a message nobody will see.
    this._languageApi.getLanguages().subscribe({
      next: (languages) => this.languages.set(languages),
      error: () => this.languages.set([]),
    });
  }

  save(): void {
    const changes: SiteSettingChange[] = this.changed().map((setting) => ({
      name: setting.name,
      value: this.draft()[setting.name] ?? '',
    }));

    if (!changes.length) {
      return;
    }

    this.saving.set(true);

    this._settingApi.saveSettings({ settings: changes }).subscribe({
      next: (list) => {
        // Adopted from the answer rather than assumed: the API is what decides
        // what is now in force, and it sends back what it wrote.
        this._adopt(list.settings);
        this.saving.set(false);
        this._notify.showSuccess('Saved.');
      },
      error: (error) => {
        this.saving.set(false);
        this._notify.showError(error?.error?.error ?? 'Those could not be saved.');
      },
    });
  }

  /** Throws away every unsaved change. */
  reset(): void {
    this._adopt(this.settings());
  }

  words(setting: AdminSiteSetting): SettingWords {
    return WORDS[setting.name] ?? { label: setting.name, help: '' };
  }

  isChanged(setting: AdminSiteSetting): boolean {
    return this.draft()[setting.name] !== (setting.value ?? '');
  }

  sectionLabel(section: string): string {
    return SECTION_LABELS[section] ?? section;
  }

  /** info, warning, danger — as words rather than as the value stored. */
  optionLabel(option: string): string {
    return { info: 'Information', warning: 'Warning', danger: 'Something is wrong' }[option] ?? option;
  }

  // ── The controls ───────────────────────────────────────────────────────────

  boolean(setting: AdminSiteSetting): boolean {
    return this.draft()[setting.name] === 'true';
  }

  setBoolean(setting: AdminSiteSetting, value: boolean): void {
    this._write(setting.name, value ? 'true' : 'false');
  }

  text(setting: AdminSiteSetting): string {
    return this.draft()[setting.name] ?? '';
  }

  setText(setting: AdminSiteSetting, value: string): void {
    this._write(setting.name, value);
  }

  message(setting: AdminSiteSetting, language: string): string {
    const map = this._json<Record<string, string>>(setting, {});

    return typeof map[language] === 'string' ? map[language] : '';
  }

  setMessage(setting: AdminSiteSetting, language: string, value: string): void {
    const map = this._json<Record<string, string>>(setting, {});

    // An emptied field drops the language rather than storing "", so the
    // fallback to English is a missing translation rather than a blank one.
    if (value.trim() === '') {
      delete map[language];
    } else {
      map[language] = value;
    }

    this._write(setting.name, JSON.stringify(map));
  }

  sectionOff(setting: AdminSiteSetting, section: string): boolean {
    return this._json<string[]>(setting, []).includes(section);
  }

  toggleSection(setting: AdminSiteSetting, section: string, off: boolean): void {
    const list = this._json<string[]>(setting, []).filter((entry) => entry !== section);

    if (off) {
      list.push(section);
    }

    this._write(setting.name, JSON.stringify(list));
  }

  // ── Behind the controls ────────────────────────────────────────────────────

  private _adopt(settings: AdminSiteSetting[]): void {
    this.settings.set(settings);
    this.draft.set(Object.fromEntries(settings.map((setting) => [setting.name, setting.value ?? ''])));
  }

  private _write(name: string, value: string): void {
    this.draft.update((draft) => ({ ...draft, [name]: value }));
  }

  /**
   * The draft value of a JSON setting, or the fallback.
   *
   * Never throws. A value that will not parse is one somebody has edited by
   * hand into something the form cannot draw, and the form showing an empty
   * control they can fill in is a better answer than a page that will not
   * render at all.
   */
  private _json<T>(setting: AdminSiteSetting, fallback: T): T {
    try {
      const parsed = JSON.parse(this.draft()[setting.name] || 'null');

      return parsed === null || typeof parsed !== 'object' ? fallback : (parsed as T);
    } catch {
      return fallback;
    }
  }
}
