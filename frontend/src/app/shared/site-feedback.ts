import { inject } from '@angular/core';
import { AnotokiAuth } from '@anotoki/lib/auth';
import { AnotokiFeedbackConfig } from '@anotoki/lib/feedback';
import { TranslationService } from '@anotoki/lib/translations';

/**
 * The places a message can be about - the server's list (backend: the
 * library's Feedback `sections`), the same values the site's form always
 * offered. Shown as they are kept, as they always were: names of the site's
 * own parts.
 */
export const FEEDBACK_SECTIONS: readonly string[] = [
  'Daily',
  'Quiz - Banners',
  'Quiz - Pixelate',
  'Quiz - Mismatch',
  'Quiz - Music',
  'Quiz - Dish',
  'Quiz - Voice',
  'Difficulties',
  'Database',
  "What's New",
  'Backgrounds',
  'Versions',
  'Other',
];

/**
 * Every extra field a message may hold, as the admin page names them (English,
 * as the admin panel is): the server's `fields` (name -> the most characters,
 * kept in the message's details) - the columns the site's own feedback table
 * had - and what else its rows brought when they moved into the library's
 * (users/feedback's migration): a suggestion's own details beside its message,
 * and a page or a browser too long for the columns they went to. The form asks
 * for some of the fields (siteFeedbackConfig); the rest are an old message's.
 */
export const FEEDBACK_FIELD_NAMES: Readonly<Record<string, string>> = {
  steps_to_reproduce: 'Steps to reproduce',
  expected_behavior: 'What should have happened',
  actual_behavior: 'What happened instead',
  browser_device_info: 'Browser and device',
  why_important: 'Why it matters',
  additional_info: 'Anything else',
  details: 'Details',
  page_url: 'Page, as sent',
  user_agent: 'Browser, as sent',
};

/**
 * What the site tells the library's feedback form (@anotoki/lib/feedback;
 * anotoki-lib 0.4.0, "The visitors' feedback form") - the form the footer's
 * Feedback opens, for visitors and players alike, in their language: the
 * library's words (`anotoki.feedback.*`, which the owner may reword on the
 * Translations page), and this site's own for its extra fields.
 *
 *  - the kinds are the library's (bug, idea, other - the site's Bug,
 *    Suggestion and Other); a bug or an idea needs a subject, as it always did;
 *  - the sections are the server's (above), and so are the extra fields the
 *    form asks for, each for its kind - a bug's steps, what should have
 *    happened and the browser, an idea's reason - in the site's own words for
 *    them (its `feedback.*` keys, which the old form had);
 *  - somebody signed in may send it without their name, and finds their
 *    address written in - the token's: the site keeps no copy of anybody's.
 *
 * Built when the form is first drawn - inside an injection context then, so
 * it takes the services it reads; the functions it gives are called as the
 * form draws, outside one.
 */
export function siteFeedbackConfig(): AnotokiFeedbackConfig {
  const i18n = inject(TranslationService);
  const auth = inject(AnotokiAuth);

  return {
    language: () => i18n.language(),
    translate: (key) => i18n.libraryWord(key),
    sections: () => FEEDBACK_SECTIONS.map((section) => ({ value: section, label: section })),
    fields: () => [
      { name: 'steps_to_reproduce', label: i18n.t('feedback.steps'), kinds: ['bug'], rows: 3, max: 5000 },
      { name: 'expected_behavior', label: i18n.t('feedback.expected'), hint: i18n.t('feedback.expectedPlaceholder'), kinds: ['bug'], rows: 2, max: 2000 },
      { name: 'browser_device_info', label: i18n.t('feedback.browser'), hint: i18n.t('feedback.browserPlaceholder'), kinds: ['bug'], rows: 1, max: 500 },
      { name: 'why_important', label: i18n.t('feedback.whyImportant'), hint: i18n.t('feedback.whyImportantPlaceholder'), kinds: ['idea'], rows: 3, max: 2000 },
    ],
    subjectRequiredFor: ['bug', 'idea'],
    signedIn: () => auth.signedIn(),
    email: () => auth.user()?.email ?? null,
  };
}
