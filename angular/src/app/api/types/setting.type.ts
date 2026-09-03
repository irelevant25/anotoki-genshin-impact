/**
 * What the site settings form sends back.
 *
 * The whole form in one request rather than a request per switch. Maintenance
 * mode and the words on the maintenance page are one decision, and saving them
 * separately leaves a window - however short - where the site is closed and
 * the sign is blank.
 *
 * Every value travels as text, whatever the setting's declared type says,
 * because that is the shape of the column it lands in. A boolean is the word
 * 'true' or the word 'false'; an i18n message and a list of sections are JSON.
 * The API checks each against its type and refuses the whole request if any
 * one of them does not fit.
 */
export interface SiteSettingChange {
  name: string;
  value: string;
}

export interface SiteSettingsSaveRequest {
  settings: SiteSettingChange[];
}
