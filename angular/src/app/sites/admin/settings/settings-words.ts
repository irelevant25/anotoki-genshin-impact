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
export interface SettingWords {
  readonly label: string;
  readonly help: string;
}

export const SETTING_WORDS: Record<string, SettingWords> = {
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
};

/** The heading and the one-liner on each card. */
export const SETTING_GROUPS: Record<string, { title: string; note: string; icon: string }> = {
  access: {
    title: 'Getting in',
    note: 'Who can reach the site, and how they sign in to it.',
    icon: 'icon-key',
  },
  notice: {
    title: 'Announcement',
    note: 'A line across the top of every page, for when one thing has to reach everybody at once.',
    icon: 'icon-bell',
  },
};

export const settingWords = (name: string): SettingWords => SETTING_WORDS[name] ?? { label: name, help: '' };

/** info, warning, danger — as words rather than as the value stored. */
export const optionLabel = (option: string): string =>
  ({ info: 'Information', warning: 'Warning', danger: 'Something is wrong' })[option] ?? option;

/** Who a page is drawn for, in words. Mirrors ROUTE_VISIBILITY in the API. */
export const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: 'Anybody',
  USER: 'Anybody signed in',
  EDITOR: 'Editors and admins',
  ADMIN: 'Admins only',
};
